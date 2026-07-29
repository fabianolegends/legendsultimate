import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeRegistrationEmail } from "@/lib/registration-access";
import { readRideWithGpsUser } from "@/lib/ridewithgps";
import { categoryForRegistration } from "@/lib/category-rules";
import { cancelAsaasCheckout, createAsaasCheckout } from "@/lib/asaas";
import { digitsOnly, isValidCpfCnpj } from "@/lib/brazilian-document";
import {
  activeRegistrationLot,
  calculateRegistrationPricing,
  isApparelSize,
  type RegistrationLot,
} from "@/lib/registration-pricing";

export const runtime = "nodejs";

function clean(value: unknown) {
  return String(value ?? "").trim();
}
function code() {
  return `LEG-${randomBytes(4).toString("hex").toUpperCase()}`;
}
function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    if (clean(body.website)) return NextResponse.json({ registered: true });
    const fullName = clean(body.full_name);
    const email = normalizeRegistrationEmail(clean(body.email));
    const phone = clean(body.phone);
    const birthDate = clean(body.birth_date);
    const gender = clean(body.gender);
    const modality =
      body.modality === "experience" ? "experience" : "gravel_race";
    const city = clean(body.city);
    const state = clean(body.state);
    const country = clean(body.country) || "Brasil";
    const cpfCnpj = digitsOnly(clean(body.cpf_cnpj));
    const postalCode = digitsOnly(clean(body.postal_code));
    const address = clean(body.address);
    const addressNumber = clean(body.address_number);
    const addressComplement = clean(body.address_complement);
    const province = clean(body.province);
    const casualShirtSize = clean(body.casual_shirt_size).toUpperCase();
    const premiumKitSelected = body.premium_kit_selected === true;
    const jerseySize = clean(body.jersey_size).toUpperCase();
    if (
      fullName.length < 3 ||
      !validEmail(email) ||
      phone.replace(/\D/g, "").length < 8 ||
      !birthDate ||
      !city
    ) {
      return NextResponse.json(
        {
          error:
            "Preencha corretamente nome, e-mail, WhatsApp, nascimento e cidade.",
        },
        { status: 400 },
      );
    }
    if (body.terms_accepted !== true || body.privacy_accepted !== true)
      return NextResponse.json(
        {
          error: "É necessário aceitar o regulamento e o tratamento dos dados.",
        },
        { status: 400 },
      );

    const supabase = createSupabaseAdmin();
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        "id, name, starts_on, status, access_mode, registration_open, registration_closes_at, registration_source, participant_limit, windfit_registration_url, registration_fee_cents, experience_fee_cents, asaas_checkout_expires_minutes, asaas_max_installments, premium_kit_enabled, premium_kit_fee_cents, casual_shirt_required, senior_discount_enabled, senior_discount_percent, regulation_version",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (eventError?.code === "42703")
      return NextResponse.json(
        { error: "Execute as migrations 013 e 024 no Supabase." },
        { status: 503 },
      );
    if (eventError) throw eventError;
    if (!event)
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 },
      );
    if (!event.registration_open || event.access_mode !== "public")
      return NextResponse.json(
        { error: "As inscrições deste evento não estão abertas ao público." },
        { status: 403 },
      );
    if (
      event.registration_closes_at &&
      new Date(event.registration_closes_at).getTime() < Date.now()
    )
      return NextResponse.json(
        { error: "O período de inscrições foi encerrado." },
        { status: 409 },
      );
    if (event.registration_source === "windfit")
      return NextResponse.json(
        {
          error: "Esta inscrição deve ser concluída pela Windfit.",
          redirect_url: event.windfit_registration_url,
        },
        { status: 409 },
      );

    const asaasEnabled = event.registration_source === "asaas";
    const lotResult = await supabase
      .from("registration_lots")
      .select(
        "id, event_id, name, starts_at, ends_at, registration_fee_cents, display_order",
      )
      .eq("event_id", event.id)
      .order("display_order");
    if (lotResult.error?.code === "42P01")
      return NextResponse.json(
        {
          error:
            "Execute a migration 024_official_event_lots_and_apparel.sql.",
        },
        { status: 503 },
      );
    if (lotResult.error) throw lotResult.error;
    const lots = (lotResult.data ?? []) as RegistrationLot[];
    const activeLot = activeRegistrationLot(lots);
    if (lots.length > 0 && !activeLot)
      return NextResponse.json(
        { error: "Não há lote de inscrições vigente nesta data." },
        { status: 409 },
      );
    const baseFeeCents =
      activeLot?.registration_fee_cents ??
      (modality === "experience"
        ? (event.experience_fee_cents ?? event.registration_fee_cents)
        : event.registration_fee_cents);
    if (
      asaasEnabled &&
      (!Number.isInteger(baseFeeCents) || Number(baseFeeCents) <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "O valor da inscrição ainda não foi configurado pela organização.",
        },
        { status: 503 },
      );
    }
    if (event.casual_shirt_required && !isApparelSize(casualShirtSize))
      return NextResponse.json(
        { error: "Selecione o tamanho da camiseta casual." },
        { status: 400 },
      );
    if (premiumKitSelected && !event.premium_kit_enabled)
      return NextResponse.json(
        { error: "O Kit Premium não está disponível neste evento." },
        { status: 400 },
      );
    if (premiumKitSelected && !isApparelSize(jerseySize))
      return NextResponse.json(
        { error: "Selecione o tamanho da jersey do Kit Premium." },
        { status: 400 },
      );
    const pricing = asaasEnabled
      ? calculateRegistrationPricing({
          baseFeeCents: Number(baseFeeCents),
          birthDate,
          eventDate: event.starts_on,
          seniorDiscountEnabled: event.senior_discount_enabled === true,
          seniorDiscountPercent: event.senior_discount_percent,
          premiumKitSelected,
          premiumKitFeeCents: event.premium_kit_fee_cents,
        })
      : null;
    if (asaasEnabled && !isValidCpfCnpj(cpfCnpj)) {
      return NextResponse.json(
        { error: "Informe um CPF ou CNPJ válido." },
        { status: 400 },
      );
    }
    if (asaasEnabled && postalCode.length !== 8) {
      return NextResponse.json(
        { error: "Informe um CEP válido com 8 números." },
        { status: 400 },
      );
    }
    if (asaasEnabled && (!address || !addressNumber || !province || !state)) {
      return NextResponse.json(
        { error: "Preencha endereço, número, bairro e estado." },
        { status: 400 },
      );
    }
    if (asaasEnabled) {
      const expirationCleanup = await supabase
        .from("registrations")
        .update({
          status: "cancelled",
          payment_status: "cancelled",
          payment_checkout_status: "EXPIRED",
          updated_at: new Date().toISOString(),
        })
        .eq("event_id", event.id)
        .eq("payment_provider", "asaas")
        .eq("payment_status", "pending")
        .lt("payment_expires_at", new Date().toISOString());
      if (expirationCleanup.error?.code === "42703") {
        return NextResponse.json(
          { error: "Execute a migration 022_asaas_checkout.sql." },
          { status: 503 },
        );
      }
      if (expirationCleanup.error) throw expirationCleanup.error;
    }

    const { data: existing, error: existingError } = await supabase
      .from("registrations")
      .select(
        "id, registration_code, status, payment_status, payment_provider, payment_checkout_url, payment_checkout_status, payment_expires_at, updated_at",
      )
      .eq("event_id", event.id)
      .eq("email", email)
      .maybeSingle();
    if (existingError) throw existingError;
    if (
      existing?.status === "confirmed" &&
      ["paid", "courtesy"].includes(existing.payment_status)
    ) {
      return NextResponse.json(
        {
          error: "Este e-mail já está inscrito no evento.",
          already_registered: true,
        },
        { status: 409 },
      );
    }
    const existingCheckoutActive =
      existing?.payment_provider === "asaas" &&
      existing.payment_checkout_url &&
      !["CANCELED", "EXPIRED", "PAID"].includes(
        existing.payment_checkout_status ?? "",
      ) &&
      (!existing.payment_expires_at ||
        new Date(existing.payment_expires_at).getTime() > Date.now());
    if (existingCheckoutActive) {
      return NextResponse.json({
        registered: true,
        resumed: true,
        checkout_url: existing.payment_checkout_url,
        registration: {
          registration_code: existing.registration_code,
          email,
          status: existing.status,
          payment_status: existing.payment_status,
        },
      });
    }
    const checkoutBeingCreated =
      existing?.payment_provider === "asaas" &&
      existing.payment_checkout_status === "CREATING" &&
      Date.now() - new Date(existing.updated_at).getTime() < 120_000;
    if (checkoutBeingCreated) {
      return NextResponse.json(
        {
          error:
            "Seu checkout já está sendo preparado. Aguarde alguns segundos e tente novamente.",
        },
        { status: 409 },
      );
    }
    if (existing && !asaasEnabled) {
      return NextResponse.json(
        {
          error: "Este e-mail já está inscrito no evento.",
          already_registered: true,
        },
        { status: 409 },
      );
    }
    if (event.participant_limit != null) {
      const { count, error: countError } = await supabase
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .neq("status", "cancelled");
      if (countError) throw countError;
      if ((count ?? 0) >= event.participant_limit)
        return NextResponse.json(
          { error: "As vagas deste evento estão esgotadas." },
          { status: 409 },
        );
    }

    const categoryRule = categoryForRegistration({
      birthDate,
      eventDate: event.starts_on,
      gender,
      modality,
    });
    if (categoryRule.error || !categoryRule.category)
      return NextResponse.json(
        {
          error:
            categoryRule.error ?? "Não foi possível definir sua categoria.",
        },
        { status: 400 },
      );
    const category = categoryRule.category;
    const now = new Date().toISOString();
    const rideWithGpsUser = readRideWithGpsUser(request);
    let linkedAthleteId: string | null = null;
    const rideWithGpsEmail = normalizeRegistrationEmail(
      rideWithGpsUser?.email ?? "",
    );
    if (rideWithGpsUser?.id && rideWithGpsEmail && rideWithGpsEmail === email) {
      const { data: linkedAthlete, error: linkedAthleteError } = await supabase
        .from("athletes")
        .select("id")
        .eq("ride_with_gps_user_id", rideWithGpsUser.id)
        .maybeSingle();
      if (linkedAthleteError) throw linkedAthleteError;
      linkedAthleteId = linkedAthlete?.id ?? null;
    }
    const registrationPayload = {
      event_id: event.id,
      registration_code: existing?.registration_code ?? code(),
      full_name: fullName,
      email,
      phone,
      birth_date: birthDate,
      gender: ["male", "female", "other"].includes(gender) ? gender : "other",
      category,
      modality,
      country_code: country.toLowerCase().includes("brasil") ? "BR" : null,
      city,
      location: [city, state, country].filter(Boolean).join(" / "),
      ...(asaasEnabled
        ? {
            cpf_cnpj: cpfCnpj,
            postal_code: postalCode,
            address,
            address_number: addressNumber,
            address_complement: addressComplement || null,
            province,
          }
        : {}),
      status: asaasEnabled ? "pending" : "confirmed",
      source: "online",
      payment_status: asaasEnabled ? "pending" : "courtesy",
      payment_provider: asaasEnabled ? "asaas" : null,
      payment_amount_cents: pricing?.totalCents ?? null,
      registration_lot_id: activeLot?.id ?? null,
      registration_lot_name: activeLot?.name ?? null,
      registration_base_fee_cents: asaasEnabled
        ? pricing?.registrationBaseFeeCents
        : null,
      senior_discount_applied: pricing?.seniorEligible ?? false,
      senior_discount_cents: pricing?.seniorDiscountCents ?? 0,
      premium_kit_selected: premiumKitSelected,
      premium_kit_fee_cents: pricing?.premiumKitFeeCents ?? 0,
      casual_shirt_size: event.casual_shirt_required
        ? casualShirtSize
        : null,
      jersey_size: premiumKitSelected ? jerseySize : null,
      regulation_version: event.regulation_version ?? null,
      payment_checkout_id: null,
      payment_checkout_url: null,
      payment_checkout_status: asaasEnabled ? "CREATING" : null,
      payment_expires_at: null,
      registered_at: now,
      terms_accepted_at: now,
      privacy_accepted_at: now,
      updated_at: now,
    };
    const registrationResult = existing
      ? await supabase
          .from("registrations")
          .update(registrationPayload)
          .eq("id", existing.id)
          .select(
            "id, registration_code, full_name, email, category, modality, status, payment_status",
          )
          .single()
      : await supabase
          .from("registrations")
          .insert(registrationPayload)
          .select(
            "id, registration_code, full_name, email, category, modality, status, payment_status",
          )
          .single();
    const { data: registration, error } = registrationResult;
    if (error?.code === "23505")
      return NextResponse.json(
        { error: "Este e-mail já está inscrito no evento." },
        { status: 409 },
      );
    if (error?.code === "P0001")
      return NextResponse.json({ error: error.message }, { status: 409 });
    if (error?.code === "23514" || error?.code === "42703")
      return NextResponse.json(
        {
          error: asaasEnabled
            ? "Execute as migrations 022, 023 e 024 no Supabase."
            : "Execute as migrations 013 e 024 no Supabase.",
        },
        { status: 503 },
      );
    if (error) throw error;

    let checkoutUrl: string | null = null;
    if (asaasEnabled) {
      try {
        const checkout = await createAsaasCheckout({
          registrationId: registration.id,
          eventSlug: slug,
          eventName: event.name,
          modality,
          registrationFeeCents: Number(
            pricing?.discountedRegistrationFeeCents,
          ),
          seniorDiscountApplied: pricing?.seniorEligible,
          premiumKit: premiumKitSelected
            ? {
                feeCents: Number(pricing?.premiumKitFeeCents),
                jerseySize,
              }
            : null,
          expiresMinutes: event.asaas_checkout_expires_minutes ?? 120,
          maxInstallments: event.asaas_max_installments ?? 1,
          customer: {
            name: fullName,
            email,
            phone,
            cpfCnpj,
            address,
            addressNumber,
            complement: addressComplement,
            postalCode,
            province,
          },
        });
        checkoutUrl = checkout.url;
        const { error: checkoutSaveError } = await supabase
          .from("registrations")
          .update({
            payment_checkout_id: checkout.id,
            payment_checkout_url: checkout.url,
            payment_checkout_status: checkout.status,
            payment_expires_at: checkout.expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", registration.id);
        if (checkoutSaveError) {
          await cancelAsaasCheckout(checkout.id).catch((cancelError) => {
            console.error(
              "Falha ao cancelar checkout Asaas órfão.",
              cancelError,
            );
          });
          throw checkoutSaveError;
        }
      } catch (checkoutError) {
        // Preserve a referência interna mesmo em timeout: o Asaas pode ter
        // criado o checkout e entregar o webhook depois da falha de rede.
        await supabase
          .from("registrations")
          .update({
            status: "cancelled",
            payment_status: "failed",
            payment_checkout_status: "FAILED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", registration.id);
        throw checkoutError;
      }
    }
    let linked = false;
    let linkWarning: string | null = null;
    if (linkedAthleteId && rideWithGpsUser?.id) {
      const linkResult = await supabase.rpc("link_registration_identity", {
        p_registration_id: registration.id,
        p_athlete_id: linkedAthleteId,
        p_ride_with_gps_user_id: rideWithGpsUser.id,
        p_actor_type: "athlete",
        p_actor_reference: String(rideWithGpsUser.id),
        p_reason: "Vínculo automático na inscrição online",
      });
      if (
        linkResult.error?.code === "PGRST202" ||
        linkResult.error?.code === "42883"
      ) {
        linkWarning =
          "Inscrição concluída. O vínculo automático ficará disponível após a atualização de segurança do banco.";
      } else if (
        linkResult.error?.code === "P0001" ||
        linkResult.error?.code === "23505"
      ) {
        linkWarning = linkResult.error.message;
      } else if (linkResult.error) {
        throw linkResult.error;
      } else {
        linked = true;
      }
    }
    return NextResponse.json(
      {
        registered: true,
        linked,
        link_warning: linkWarning,
        checkout_url: checkoutUrl,
        event: { name: event.name },
        registration,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a inscrição.",
      },
      { status: 500 },
    );
  }
}
