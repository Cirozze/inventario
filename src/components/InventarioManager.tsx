"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import type { Oggetto, MovimentoTipo, DashboardSummary } from "@/types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

export default function InventarioManager() {
  const router = useRouter();
  const [oggetti, setOggetti] = useState<Oggetto[] | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [oggettoId, setOggettoId] = useState("");
  const [tipo, setTipo] = useState<MovimentoTipo>("acquisto");
  const [quantita, setQuantita] = useState("1");
  const [prezzoUnitario, setPrezzoUnitario] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOggetti = useCallback(async () => {
    const res = await fetch("/api/oggetti", { cache: "no-store" });
    if (!res.ok) throw new Error("Errore nel caricamento degli oggetti");
    const data = await res.json();
    const list: Oggetto[] = data.oggetti ?? [];
    setOggetti(list);
    return list;
  }, []);

  const loadSummary = useCallback(async () => {
    const res = await fetch("/api/dashboard", { cache: "no-store" });
    if (!res.ok) throw new Error("Errore nel caricamento del riepilogo");
    const data = await res.json();
    setSummary(data);
  }, []);

  useEffect(() => {
    loadOggetti().catch((err) => setLoadError(err.message));
    loadSummary().catch(() => {
      // il riepilogo economico e' un extra: se fallisce non blocchiamo la pagina
    });
  }, [loadOggetti, loadSummary]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  function openModal(oggetto: Oggetto, tipoIniziale: MovimentoTipo) {
    setOggettoId(oggetto.id);
    setTipo(tipoIniziale);
    setQuantita("1");
    setPrezzoUnitario(oggetto.prezzo.toString());
    setError(null);
    setModalOpen(true);
  }

  const selezionato = oggetti?.find((o) => o.id === oggettoId);
  const inStock = oggetti?.filter((o) => o.quantita > 0) ?? [];

  function handleOggettoChange(id: string) {
    setOggettoId(id);
    const trovato = oggetti?.find((o) => o.id === id);
    if (trovato) {
      setPrezzoUnitario(trovato.prezzo.toString());
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const quantitaNum = Number(quantita);
    const prezzoNum = Number(prezzoUnitario);

    if (!oggettoId) {
      setError("Seleziona un oggetto");
      return;
    }
    if (!Number.isInteger(quantitaNum) || quantitaNum <= 0) {
      setError("La quantita' deve essere un intero maggiore di zero");
      return;
    }
    if (Number.isNaN(prezzoNum) || prezzoNum < 0) {
      setError("Il prezzo unitario non puo' essere negativo");
      return;
    }
    if (tipo === "vendita" && selezionato && quantitaNum > selezionato.quantita) {
      setError(`Stock insufficiente: disponibili ${selezionato.quantita}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/movimenti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oggetto_id: oggettoId,
          tipo,
          quantita: quantitaNum,
          prezzo_unitario: prezzoNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante il salvataggio");

      setModalOpen(false);
      setSuccessMessage(
        tipo === "acquisto"
          ? `Acquistati ${quantitaNum} pz di ${selezionato?.nome ?? "oggetto"}`
          : `Venduti ${quantitaNum} pz di ${selezionato?.nome ?? "oggetto"}`
      );
      await Promise.all([loadOggetti(), loadSummary().catch(() => {})]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <p className="text-red-400">{loadError}</p>;

  return (
    <div className="flex flex-col gap-6">
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Valore inventario</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">
              {formatCurrency(summary.valoreTotale)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Speso (acquisti)</p>
            <p className="mt-1 text-lg font-semibold text-red-400">
              -{formatCurrency(summary.totaleSpeso)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Incassato (vendite)</p>
            <p className="mt-1 text-lg font-semibold text-emerald-400">
              +{formatCurrency(summary.totaleIncassato)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Saldo netto</p>
            <p
              className={`mt-1 text-lg font-semibold ${
                summary.saldoNetto >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {summary.saldoNetto >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(summary.saldoNetto))}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">Scorte attuali</h2>
        {oggetti && oggetti.length > 0 && (
          <Button onClick={() => openModal(oggetti[0], "acquisto")}>Nuovo movimento</Button>
        )}
      </div>

      {successMessage && <p className="text-sm text-emerald-400">{successMessage}</p>}

      {!oggetti && <p className="text-zinc-500">Caricamento...</p>}
      {oggetti && oggetti.length === 0 && (
        <p className="text-zinc-500">
          Nessun oggetto nel catalogo. Creane uno nella sezione Oggetti.
        </p>
      )}
      {oggetti && oggetti.length > 0 && inStock.length === 0 && (
        <p className="text-zinc-500">
          Non hai ancora nulla in scorta. Usa &quot;Nuovo movimento&quot; per registrare il primo
          acquisto.
        </p>
      )}
      {inStock.length > 0 && (
        <ul className="flex flex-col divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
          {inStock.map((o) => (
            <li key={o.id} className="flex items-center gap-3 p-3">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-zinc-800">
                {o.foto_url && (
                  <Image
                    src={o.foto_url}
                    alt={o.nome}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-100">{o.nome}</p>
                <p className="text-sm text-zinc-500">{formatCurrency(o.prezzo)}</p>
              </div>
              <span className="rounded-full bg-blue-500/15 px-3 py-1 text-sm font-semibold text-blue-400">
                {o.quantita} pz
              </span>
            </li>
          ))}
        </ul>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registra movimento">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Oggetto" htmlFor="oggetto">
            <Select
              id="oggetto"
              value={oggettoId}
              onChange={(e) => handleOggettoChange(e.target.value)}
              required
            >
              {oggetti?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome} (disponibili: {o.quantita})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tipo movimento" htmlFor="tipo">
            <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as MovimentoTipo)}>
              <option value="acquisto">Acquisto (+ scorta)</option>
              <option value="vendita">Vendita (- scorta)</option>
            </Select>
          </Field>

          <Field label="Quantita'" htmlFor="quantita">
            <Input
              id="quantita"
              type="number"
              min="1"
              step="1"
              value={quantita}
              onChange={(e) => setQuantita(e.target.value)}
              required
            />
          </Field>

          <Field label="Prezzo unitario (EUR)" htmlFor="prezzoUnitario">
            <Input
              id="prezzoUnitario"
              type="number"
              min="0"
              step="0.01"
              value={prezzoUnitario}
              onChange={(e) => setPrezzoUnitario(e.target.value)}
              required
            />
          </Field>

          {selezionato && (
            <p className="text-sm text-zinc-500">
              Totale: {(Number(quantita) * Number(prezzoUnitario) || 0).toFixed(2)} EUR
            </p>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvataggio..." : "Registra"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Annulla
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
