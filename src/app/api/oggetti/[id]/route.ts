import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { oggettoUpdateSchema } from "@/lib/validation";

interface Params {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("oggetti")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Oggetto non trovato" }, { status: 404 });
  }

  return NextResponse.json({ oggetto: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const parsed = oggettoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("oggetti")
    .update(parsed.data)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ oggetto: data });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("oggetti").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
