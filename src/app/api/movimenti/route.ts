import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { movimentoInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const oggettoId = searchParams.get("oggetto_id");
  const sort = searchParams.get("sort") === "asc" ? true : false;

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("movimenti")
    .select("*, oggetti(nome, unita)")
    .order("data", { ascending: sort });

  if (oggettoId) {
    query = query.eq("oggetto_id", oggettoId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ movimenti: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const parsed = movimentoInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("registra_movimento", {
    p_oggetto_id: parsed.data.oggetto_id,
    p_tipo: parsed.data.tipo,
    p_quantita: parsed.data.quantita,
    p_prezzo_unitario: parsed.data.prezzo_unitario,
  });

  if (error) {
    // Gli errori applicativi (stock insufficiente, oggetto non trovato, ecc.)
    // arrivano dalla funzione Postgres come eccezioni: li trattiamo come 400.
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ movimento: data }, { status: 201 });
}
