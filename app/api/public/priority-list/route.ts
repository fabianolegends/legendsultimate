import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Campo invisível: robôs costumam preenchê-lo.
  if (clean(body.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  const fullName = clean(body.full_name, 120);
  const email = clean(body.email, 180).toLowerCase();
  const city = clean(body.city, 120);
  const phone = clean(body.phone, 30);
  const expectations = clean(body.expectations, 1000);

  if (fullName.length < 3) {
    return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }
  if (city.length < 2) {
    return NextResponse.json({ error: "Informe sua cidade." }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "Informe um telefone válido." }, { status: 400 });
  }
  if (expectations.length < 10) {
    return NextResponse.json(
      { error: "Conte um pouco mais sobre o que você espera da prova." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("priority_list_leads").upsert(
      {
        full_name: fullName,
        email,
        email_normalized: email,
        city,
        phone,
        expectations,
        status: "new",
        source: "website",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email_normalized" },
    );

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "O cadastro está sendo preparado. Tente novamente em instantes." },
          { status: 503 },
        );
      }
      console.error("priority-list.insert", error);
      return NextResponse.json(
        { error: "Não foi possível concluir o cadastro. Tente novamente." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("priority-list.unavailable", error);
    return NextResponse.json(
      { error: "Serviço temporariamente indisponível." },
      { status: 500 },
    );
  }
}
