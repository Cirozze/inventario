"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Oggetto } from "@/types";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { formatUnita } from "@/lib/units";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

export default function OggettiList() {
  const router = useRouter();
  const [oggetti, setOggetti] = useState<Oggetto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Oggetto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/oggetti", { cache: "no-store" });
      if (!res.ok) throw new Error("Errore nel caricamento degli oggetti");
      const data = await res.json();
      setOggetti(data.oggetti);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function closeConfirm() {
    setPendingDelete(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/oggetti/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore durante l'eliminazione");
      setOggetti((prev) => prev?.filter((o) => o.id !== pendingDelete.id) ?? null);
      setPendingDelete(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setDeleting(false);
    }
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (!oggetti) return <p className="text-zinc-500">Caricamento...</p>;

  if (oggetti.length === 0) {
    return <p className="text-zinc-500">Nessun oggetto presente. Aggiungine uno per iniziare.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {oggetti.map((oggetto) => (
          <li
            key={oggetto.id}
            className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-zinc-800">
              {oggetto.foto_url ? (
                <Image
                  src={oggetto.foto_url}
                  alt={oggetto.nome}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                  No foto
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="font-medium text-zinc-100">{oggetto.nome}</p>
              <p className="text-sm text-zinc-500">
                {formatCurrency(oggetto.prezzo)} &middot; {oggetto.quantita} {formatUnita(oggetto.unita)}
              </p>
            </div>

            <div className="flex gap-2">
              <Link href={`/oggetti/${oggetto.id}`}>
                <Button variant="secondary">Modifica</Button>
              </Link>
              <Button variant="danger" onClick={() => setPendingDelete(oggetto)}>
                Elimina
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmModal
        open={pendingDelete !== null}
        title="Eliminare oggetto?"
        message={
          pendingDelete
            ? `Stai per eliminare "${pendingDelete.nome}". Verranno rimossi anche tutti i movimenti collegati. L'operazione non e' reversibile.`
            : ""
        }
        confirmLabel="Elimina"
        danger
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={closeConfirm}
      />
    </>
  );
}
