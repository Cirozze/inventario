"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Field from "@/components/ui/Field";
import type { Oggetto } from "@/types";

interface OggettoFormProps {
  oggetto?: Oggetto;
}

export default function OggettoForm({ oggetto }: OggettoFormProps) {
  const router = useRouter();
  const isEdit = Boolean(oggetto);

  const [nome, setNome] = useState(oggetto?.nome ?? "");
  const [prezzo, setPrezzo] = useState(oggetto?.prezzo?.toString() ?? "0");
  const [fotoUrl, setFotoUrl] = useState<string | null>(oggetto?.foto_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante l'upload");
      setFotoUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const prezzoNum = Number(prezzo);

    if (!nome.trim()) {
      setError("Il nome e' obbligatorio");
      return;
    }
    if (Number.isNaN(prezzoNum) || prezzoNum < 0) {
      setError("Il prezzo non puo' essere negativo");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: nome.trim(),
        prezzo: prezzoNum,
        foto_url: fotoUrl,
      };

      const res = await fetch(isEdit ? `/api/oggetti/${oggetto!.id}` : "/api/oggetti", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante il salvataggio");

      router.push("/oggetti");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <Field label="Nome" htmlFor="nome">
        <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </Field>

      <Field label="Prezzo (EUR)" htmlFor="prezzo">
        <Input
          id="prezzo"
          type="number"
          min="0"
          step="0.01"
          value={prezzo}
          onChange={(e) => setPrezzo(e.target.value)}
          required
        />
      </Field>

      <Field label="Foto" htmlFor="foto">
        <input
          ref={fileInputRef}
          id="foto"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Scegli file
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
          >
            Scatta foto
          </Button>
        </div>
        {uploading && <p className="text-sm text-zinc-500">Caricamento foto...</p>}
        {fotoUrl && (
          <Image
            src={fotoUrl}
            alt="Anteprima"
            width={96}
            height={96}
            className="mt-2 h-24 w-24 rounded-md object-cover"
          />
        )}
      </Field>

      {!isEdit && (
        <p className="text-sm text-zinc-500">
          Il nuovo oggetto partira' con quantita' 0. Per aggiungere scorta usa la sezione Inventario.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Salvataggio..." : isEdit ? "Salva modifiche" : "Crea oggetto"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/oggetti")}>
          Annulla
        </Button>
      </div>
    </form>
  );
}
