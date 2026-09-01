"use client";

import { useEffect, useState } from "react";
import type { DashboardSummary } from "@/types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

export default function DashboardStats() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Errore nel caricamento del riepilogo");
        return res.json();
      })
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!summary) return <p className="text-zinc-500">Caricamento...</p>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-500">Valore totale inventario</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
          {formatCurrency(summary.valoreTotale)}
        </p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-500">Numero oggetti</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
          {summary.numeroOggetti}
        </p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-500">Speso (acquisti)</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-red-400">
          -{formatCurrency(summary.totaleSpeso)}
        </p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-500">Incassato (vendite)</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-emerald-400">
          +{formatCurrency(summary.totaleIncassato)}
        </p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 sm:col-span-2">
        <p className="text-sm text-zinc-500">Saldo netto</p>
        <p
          className={`mt-1 text-3xl font-semibold tracking-tight ${
            summary.saldoNetto >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {summary.saldoNetto >= 0 ? "+" : "-"}
          {formatCurrency(Math.abs(summary.saldoNetto))}
        </p>
      </div>
    </div>
  );
}
