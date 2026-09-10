"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Movimento, Oggetto } from "@/types";
import { Input, Select } from "@/components/ui/Input";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { formatUnita } from "@/lib/units";

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
  const [editing, setEditing] = useState<Movimento | null>(null);

  function caricaMovimenti() {
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
  }

  useEffect(() => {
    fetch("/api/oggetti", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setOggetti(data.oggetti ?? []));
  }, []);

  useEffect(caricaMovimenti, [oggettoId, sort]);

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
                <th className="px-3 py-2.5" />
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
                  <td className="px-3 py-2.5 text-right">
                    {m.quantita} {m.oggetti ? formatUnita(m.oggetti.unita) : ""}
                  </td>
                  <td className="px-3 py-2.5 text-right">{formatCurrency(m.prezzo_unitario)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-zinc-100">
                    {formatCurrency(m.totale)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => setEditing(m)}
                      className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
                    >
                      Modifica prezzo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModificaPrezzoModal
        movimento={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          caricaMovimenti();
        }}
      />
    </div>
  );
}

interface ModificaPrezzoModalProps {
  movimento: Movimento | null;
  onClose: () => void;
  onSaved: () => void;
}

function ModificaPrezzoModal({ movimento, onClose, onSaved }: ModificaPrezzoModalProps) {
  const [prezzo, setPrezzo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (movimento) {
      setPrezzo(movimento.prezzo_unitario.toString());
      setError(null);
    }
  }, [movimento]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!movimento) return;

    const prezzoNum = Number(prezzo);
    if (Number.isNaN(prezzoNum) || prezzoNum < 0) {
      setError("Il prezzo unitario non puo' essere negativo");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/movimenti/${movimento.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prezzo_unitario: prezzoNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante il salvataggio");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(movimento)} onClose={onClose} title="Correggi prezzo unitario">
      {movimento && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-zinc-500">
            {movimento.oggetti?.nome ?? "Oggetto"} · {movimento.quantita}{" "}
            {movimento.oggetti ? formatUnita(movimento.oggetti.unita) : ""} · {movimento.tipo}
          </p>

          <Field label="Prezzo unitario (EUR)" htmlFor="prezzoModifica">
            <Input
              id="prezzoModifica"
              type="number"
              min="0"
              step="0.01"
              value={prezzo}
              onChange={(e) => setPrezzo(e.target.value)}
              required
              autoFocus
            />
          </Field>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvataggio..." : "Salva"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Annulla
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
