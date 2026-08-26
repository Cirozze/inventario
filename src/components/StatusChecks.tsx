"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

interface StatusCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export default function StatusChecks() {
  const [checks, setChecks] = useState<StatusCheck[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error("Errore nel caricamento dello stato");
      const data = await res.json();
      setChecks(data.checks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Button variant="secondary" onClick={load} disabled={loading}>
        {loading ? "Verifica in corso..." : "Aggiorna"}
      </Button>

      {error && <p className="text-red-400">{error}</p>}
      {!checks && !error && <p className="text-zinc-500">Verifica in corso...</p>}

      {checks && (
        <ul className="flex flex-col gap-3">
          {checks.map((check) => (
            <li key={check.name} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    check.ok ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <span className="font-medium text-zinc-100">{check.name}</span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                    check.ok ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {check.ok ? "OK" : "Errore"}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">{check.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
