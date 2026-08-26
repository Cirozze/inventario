"use client";

import { useEffect, useState } from "react";
import type { Movimento, Oggetto } from "@/types";
import { Select } from "@/components/ui/Input";
import Field from "@/components/ui/Field";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value)
  );
}

export default function MovimentiTable() {
  const [oggetti, setOggetti] = useState<Oggetto[]>([]);
  const [movimenti, setMovimenti] = useState<Movimento[] | null>(null);
  const [oggettoId, setOggettoId] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/oggetti", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setOggetti(data.oggetti ?? []));
  }, []);

  useEffect(() => {
    setMovimenti(null);
    const params = new URLSearchParams();
    if (oggettoId) params.set("oggetto_id", oggettoId);
    params.set("sort", sort);

    fetch(`/api/movimenti?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Errore nel caricamento dei movimenti");
        return res.json();
      })
      .then((data) => setMovimenti(data.movimenti))
      .catch((err) => setError(err.message));
  }, [oggettoId, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Field label="Filtra per oggetto" htmlFor="filtroOggetto">
          <Select
            id="filtroOggetto"
            value={oggettoId}
            onChange={(e) => setOggettoId(e.target.value)}
          >
            <option value="">Tutti gli oggetti</option>
            {oggetti.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Ordina per data" htmlFor="ordina">
          <Select id="ordina" value={sort} onChange={(e) => setSort(e.target.value as "desc" | "asc")}>
            <option value="desc">Piu' recenti prima</option>
            <option value="asc">Meno recenti prima</option>
          </Select>
        </Field>
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {!error && !movimenti && <p className="text-zinc-500">Caricamento...</p>}
      {movimenti && movimenti.length === 0 && (
        <p className="text-zinc-500">Nessun movimento registrato.</p>
      )}

      {movimenti && movimenti.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2.5">Data</th>
                <th className="px-3 py-2.5">Oggetto</th>
                <th className="px-3 py-2.5">Tipo</th>
                <th className="px-3 py-2.5 text-right">Quantita'</th>
                <th className="px-3 py-2.5 text-right">Prezzo unit.</th>
                <th className="px-3 py-2.5 text-right">Totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {movimenti.map((m) => (
                <tr key={m.id} className="text-zinc-300 transition-colors hover:bg-zinc-800/50">
                  <td className="whitespace-nowrap px-3 py-2.5 text-zinc-500">{formatDate(m.data)}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-100">{m.oggetti?.nome ?? "-"}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        m.tipo === "acquisto"
                          ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400"
                          : "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400"
                      }
                    >
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">{m.quantita}</td>
                  <td className="px-3 py-2.5 text-right">{formatCurrency(m.prezzo_unitario)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-zinc-100">
                    {formatCurrency(m.totale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
