import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createSessionCookieValue, verifySessionCookieValue } from "@/lib/auth/cookie";

export const dynamic = "force-dynamic";

interface StatusCheck {
  name: string;
  ok: boolean;
  detail: string;
}

async function checkEnvVars(): Promise<StatusCheck> {
  const required = [
    "APP_PASSWORD",
    "COOKIE_SECRET",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      name: "Variabili d'ambiente",
      ok: false,
      detail: `Mancanti: ${missing.join(", ")}`,
    };
  }

  return {
    name: "Variabili d'ambiente",
    ok: true,
    detail: "Tutte le variabili richieste sono impostate",
  };
}

async function checkCookieSigning(): Promise<StatusCheck> {
  try {
    const value = await createSessionCookieValue();
    const valid = await verifySessionCookieValue(value);
    if (!valid) {
      return { name: "Firma cookie (COOKIE_SECRET)", ok: false, detail: "Verifica fallita dopo la firma" };
    }
    return { name: "Firma cookie (COOKIE_SECRET)", ok: true, detail: "Firma e verifica HMAC funzionanti" };
  } catch (error) {
    return {
      name: "Firma cookie (COOKIE_SECRET)",
      ok: false,
      detail: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
}

async function checkDatabase(): Promise<StatusCheck> {
  try {
    const supabase = getSupabaseServerClient();
    const { error, count } = await supabase
      .from("oggetti")
      .select("*", { count: "exact", head: true });

    if (error) {
      return { name: "Database (tabella oggetti)", ok: false, detail: error.message };
    }

    return {
      name: "Database (tabella oggetti)",
      ok: true,
      detail: `Connessione OK - ${count ?? 0} oggetti presenti`,
    };
  } catch (error) {
    return {
      name: "Database (tabella oggetti)",
      ok: false,
      detail: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
}

async function checkRpc(): Promise<StatusCheck> {
  try {
    const supabase = getSupabaseServerClient();
    // UUID inesistente: la funzione deve rispondere con "Oggetto non trovato"
    // senza scrivere nulla. Se la funzione non esiste o i permessi sono
    // sbagliati, l'errore sara' diverso (es. "does not exist" o "permission denied").
    const { error } = await supabase.rpc("registra_movimento", {
      p_oggetto_id: "00000000-0000-0000-0000-000000000000",
      p_tipo: "acquisto",
      p_quantita: 1,
      p_prezzo_unitario: 0,
    });

    if (error && /non trovato/i.test(error.message)) {
      return { name: "Funzione RPC registra_movimento", ok: true, detail: "Funzione raggiungibile ed eseguibile" };
    }

    if (error) {
      return { name: "Funzione RPC registra_movimento", ok: false, detail: error.message };
    }

    return { name: "Funzione RPC registra_movimento", ok: true, detail: "Funzione raggiungibile ed eseguibile" };
  } catch (error) {
    return {
      name: "Funzione RPC registra_movimento",
      ok: false,
      detail: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
}

async function checkStorage(): Promise<StatusCheck> {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "foto-oggetti";
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.storage.getBucket(bucket);

    if (error) {
      return { name: `Storage bucket "${bucket}"`, ok: false, detail: error.message };
    }

    return {
      name: `Storage bucket "${bucket}"`,
      ok: true,
      detail: data.public ? "Bucket trovato ed e' pubblico" : "Bucket trovato ma NON e' pubblico",
    };
  } catch (error) {
    return {
      name: `Storage bucket "${bucket}"`,
      ok: false,
      detail: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkEnvVars(),
    checkCookieSigning(),
    checkDatabase(),
    checkRpc(),
    checkStorage(),
  ]);

  return NextResponse.json({ checks }, { headers: { "Cache-Control": "no-store" } });
}
