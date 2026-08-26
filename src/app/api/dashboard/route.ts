import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Oggetto } from "@/types";

// Evita che Next.js metta in cache la risposta: i totali devono riflettere
// sempre lo stato reale del database, non un valore congelato alla prima richiesta.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServerClient();

  const [oggettiRes, movimentiRes, impostazioniRes] = await Promise.all([
    supabase.from("oggetti").select("*"),
    supabase.from("movimenti").select("tipo, totale, data"),
    supabase.from("impostazioni").select("saldo_reset_at").eq("id", true).maybeSingle(),
  ]);

  if (oggettiRes.error) {
    return NextResponse.json({ error: oggettiRes.error.message }, { status: 500 });
  }
  if (movimentiRes.error) {
    return NextResponse.json({ error: movimentiRes.error.message }, { status: 500 });
  }

  const oggetti = (oggettiRes.data ?? []) as Oggetto[];
  const movimenti = movimentiRes.data ?? [];
  // Se la tabella impostazioni non esiste ancora (migrazione non eseguita),
  // ci comportiamo come se il saldo non fosse mai stato azzerato.
  const saldoResetAt = impostazioniRes.error ? null : impostazioniRes.data?.saldo_reset_at ?? null;

  const valoreTotale = oggetti.reduce((sum, o) => sum + o.prezzo * o.quantita, 0);
  const numeroOggetti = oggetti.length;

  const movimentiPerSaldo = saldoResetAt
    ? movimenti.filter((m) => m.data > saldoResetAt)
    : movimenti;

  const totaleSpeso = movimentiPerSaldo
    .filter((m) => m.tipo === "acquisto")
    .reduce((sum, m) => sum + m.totale, 0);
  const totaleIncassato = movimentiPerSaldo
    .filter((m) => m.tipo === "vendita")
    .reduce((sum, m) => sum + m.totale, 0);
  const saldoNetto = totaleIncassato - totaleSpeso;

  return NextResponse.json(
    {
      valoreTotale,
      numeroOggetti,
      totaleSpeso,
      totaleIncassato,
      saldoNetto,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
