"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";

export default function ResetFinanzeButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function openModal() {
    setPassword("");
    setError(null);
    setDone(false);
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reset-saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Errore durante il reset");

      setOpen(false);
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-red-900/40 bg-red-950/10 p-4">
      <h2 className="text-sm font-medium text-red-400">Zona pericolosa</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Azzera solo speso, incassato e saldo netto. Lo storico movimenti resta visibile per
        intero in Movimenti e le quantita&apos; in scorta non cambiano. Richiede la password
        dell&apos;app.
      </p>
      {done && <p className="mt-2 text-sm text-emerald-400">Saldo azzerato.</p>}
      <Button variant="danger" className="mt-3" onClick={openModal}>
        Reset saldo
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Conferma reset saldo">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-zinc-400">
            Speso, incassato e saldo netto torneranno a 0. Lo storico movimenti e le quantita&apos;
            in scorta <strong>non</strong> vengono modificati. Inserisci la password dell&apos;app
            per confermare.
          </p>
          <Field label="Password" htmlFor="reset-password">
            <Input
              id="reset-password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="danger" disabled={loading || !password}>
              {loading ? "Reset in corso..." : "Conferma reset"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annulla
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
