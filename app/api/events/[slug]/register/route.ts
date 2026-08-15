import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = createSupabaseAdmin();
    const { data: event, error } = await supabase
      .from("events")
      .select("id, windfit_registration_url")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!event)
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 },
      );

    return NextResponse.json(
      {
        error:
          "As inscrições são realizadas exclusivamente pela Windfit. Nenhuma inscrição foi criada no Legends Engine.",
        provider: "windfit",
        redirect_url: event.windfit_registration_url,
      },
      { status: 409 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível localizar a inscrição na Windfit.",
      },
      { status: 500 },
    );
  }
}
