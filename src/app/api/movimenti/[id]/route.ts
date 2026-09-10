import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { movimentoUpdateSchema } from "@/lib/validation";

interface Params {
  params: { id: string };
}

export const dynamic = "force-dynamic";

// Corregge solo il prezzo unitario di un movimento gia' registrato (es. errore
// di battitura). Ricalcola il totale della riga ma non tocca la quantita' in
// scorta dell'oggetto: lo stock e' gia' stato applicato alla registrazione e
// non deve cambiare per una semplice correzione di prezzo. Il saldo economico
// si aggiorna da solo, perche' speso/incassato sono sempre sommati dal vivo
// dalla tabella movimenti (nessun totale cumulativo da correggere a mano).
export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const parsed = movimentoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  const { data: esistente, error: fetchError } = await supabase
    .from("movimenti")
    .select("quantita")
    .eq("id", params.id)
    .single();

  if (fetchError || !esistente) {
    return NextResponse.json({ error: "Movimento non trovato" }, { status: 404 });
  }

  const nuovoTotale = esistente.quantita * parsed.data.prezzo_unitario;

  const { data, error } = await supabase
    .from("movimenti")
    .update({ prezzo_unitario: parsed.data.prezzo_unitario, totale: nuovoTotale })
    .eq("id", params.id)
    .select("*, oggetti(nome, unita)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ movimento: data });
}
