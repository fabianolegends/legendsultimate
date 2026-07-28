import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { readAsaasWebhookToken } from "@/lib/asaas";
import { mapAsaasEventToRegistrationUpdate, registrationIdFromExternalReference } from "@/lib/asaas-webhook";

export const runtime = "nodejs";

type AsaasWebhook = {
  id?: unknown;
  event?: unknown;
  dateCreated?: unknown;
  checkout?: Record<string, unknown>;
  payment?: Record<string, unknown>;
};

function secureEqual(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function checkoutId(body: AsaasWebhook) {
  return text(body.checkout?.id)
    || text(body.payment?.checkoutSession)
    || text(body.payment?.checkout)
    || text(body.payment?.checkoutId)
    || null;
}

function externalRegistrationId(body: AsaasWebhook) {
  return registrationIdFromExternalReference(body.checkout?.externalReference)
    || registrationIdFromExternalReference(body.payment?.externalReference);
}

function eventTimestamp(value: unknown) {
  const parsed = new Date(text(value));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export async function POST(request: NextRequest) {
  let expectedToken: string;
  try {
    expectedToken = readAsaasWebhookToken();
  } catch {
    return NextResponse.json({ error: "Webhook Asaas não configurado." }, { status: 503 });
  }
  const receivedToken = request.headers.get("asaas-access-token")?.trim() ?? "";
  if (!receivedToken || !secureEqual(receivedToken, expectedToken)) {
    return NextResponse.json({ error: "Assinatura do webhook inválida." }, { status: 401 });
  }

  let body: AsaasWebhook;
  try {
    body = await request.json() as AsaasWebhook;
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  const providerEventId = text(body.id);
  const eventType = text(body.event);
  if (!providerEventId || !eventType) {
    return NextResponse.json({ error: "Evento sem identificador ou tipo." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: previous, error: previousError } = await supabase
    .from("payment_webhook_events")
    .select("id, processed_at")
    .eq("provider", "asaas")
    .eq("provider_event_id", providerEventId)
    .maybeSingle();
  if (previousError?.code === "42P01") {
    return NextResponse.json({ error: "Execute a migration 022_asaas_checkout.sql." }, { status: 503 });
  }
  if (previousError) throw previousError;
  if (previous?.processed_at) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  let storedEventId = previous?.id ?? null;
  if (!storedEventId) {
    const { data: stored, error: storeError } = await supabase
      .from("payment_webhook_events")
      .insert({
        provider: "asaas",
        provider_event_id: providerEventId,
        event_type: eventType,
        payload: body,
      })
      .select("id")
      .single();
    if (storeError?.code === "23505") {
      const duplicate = await supabase.from("payment_webhook_events")
        .select("id, processed_at")
        .eq("provider", "asaas")
        .eq("provider_event_id", providerEventId)
        .single();
      if (duplicate.error) throw duplicate.error;
      if (duplicate.data.processed_at) return NextResponse.json({ received: true, duplicate: true });
      storedEventId = duplicate.data.id;
    } else if (storeError) {
      throw storeError;
    } else {
      storedEventId = stored.id;
    }
  }

  const providerCheckoutId = checkoutId(body);
  const registrationId = externalRegistrationId(body);
  if (!providerCheckoutId && !registrationId) {
    await supabase.from("payment_webhook_events").update({
      processed_at: new Date().toISOString(),
      processing_error: "Evento sem checkout ou referência de inscrição reconhecível.",
    }).eq("id", storedEventId);
    return NextResponse.json({ received: true, ignored: true });
  }
  let registration: { id: string; payment_status: string; payment_checkout_id: string | null } | null = null;
  if (providerCheckoutId) {
    const byCheckout = await supabase.from("registrations")
      .select("id, payment_status, payment_checkout_id")
      .eq("payment_checkout_id", providerCheckoutId)
      .maybeSingle();
    if (byCheckout.error) throw byCheckout.error;
    registration = byCheckout.data;
  }
  if (!registration && registrationId) {
    const byReference = await supabase.from("registrations")
      .select("id, payment_status, payment_checkout_id")
      .eq("id", registrationId)
      .maybeSingle();
    if (byReference.error) throw byReference.error;
    registration = byReference.data;
  }
  if (!registration) {
    await supabase.from("payment_webhook_events").update({
      processed_at: new Date().toISOString(),
      processing_error: "Evento não pertence a uma inscrição do Legends Engine.",
    }).eq("id", storedEventId);
    return NextResponse.json({ received: true, ignored: true });
  }

  const at = eventTimestamp(body.dateCreated);
  const update = mapAsaasEventToRegistrationUpdate(eventType, at);
  const reconciliation = {
    ...(update ?? {}),
    ...(!registration.payment_checkout_id && providerCheckoutId ? { payment_checkout_id: providerCheckoutId } : {}),
    ...(text(body.checkout?.link) ? { payment_checkout_url: text(body.checkout?.link) } : {}),
  };
  if (Object.keys(reconciliation).length) {
    const isFinancialReversal = ["refunded", "chargeback"].includes(update?.payment_status ?? "");
    const shouldPreservePaid = registration.payment_status === "paid"
      && update?.payment_status !== "paid"
      && !isFinancialReversal;
    if (!shouldPreservePaid) {
      const { error: updateError } = await supabase.from("registrations")
        .update(reconciliation)
        .eq("id", registration.id);
      if (updateError) {
        await supabase.from("payment_webhook_events").update({
          processing_error: updateError.message,
        }).eq("id", storedEventId);
        throw updateError;
      }
    }
  }

  const { error: processedError } = await supabase.from("payment_webhook_events").update({
    registration_id: registration.id,
    processed_at: new Date().toISOString(),
    processing_error: update ? null : "Evento conhecido pelo Asaas, sem mudança de elegibilidade no Legends.",
  }).eq("id", storedEventId);
  if (processedError) throw processedError;
  return NextResponse.json({ received: true, updated: Object.keys(reconciliation).length > 0, registration_id: registration.id });
}
