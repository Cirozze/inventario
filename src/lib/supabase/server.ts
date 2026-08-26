import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let cachedClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Client Supabase con service_role key. Da usare SOLO in codice server-side
 * (API routes). Bypassa RLS: non esporre mai al browser.
 */
export function getSupabaseServerClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere definite nelle variabili d'ambiente"
    );
  }

  cachedClient = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return cachedClient;
}
