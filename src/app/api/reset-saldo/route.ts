import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isPasswordCorrect } from "@/lib/auth/config";

// Azzera SOLO il saldo economico (speso/incassato/saldo netto), spostando in
// avanti il punto da cui vengono ricalcolati: i movimenti precedenti restano
// intatti e visibili per intero nella pagina Movimenti, e le quantita' in
// scorta degli oggetti non vengono toccate.
// Richiede la stessa password usata per accedere all'app come conferma
// aggiuntiva, anche se la richiesta arriva gia' autenticata via cookie.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";

  let correct: boolean;
  try {
    correct = isPasswordCorrect(password);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Configurazione server mancante" }, { status: 500 });
  }

  if (!correct) {
    return NextResponse.json({ error: "Password errata" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("impostazioni")
    .update({ saldo_reset_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
