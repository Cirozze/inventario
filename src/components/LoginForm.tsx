"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Field from "@/components/ui/Field";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Errore di accesso");
        return;
      }

      const redirectTo = searchParams.get("from") || "/";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Errore di rete, riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-24 flex max-w-sm flex-col items-center gap-6 px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-950/50">
        I
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl shadow-black/40"
      >
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Inventario</h1>
          <p className="text-sm text-zinc-500">Inserisci la password per continuare</p>
        </div>
        <Field label="Password" htmlFor="password" error={error ?? undefined}>
          <Input
            id="password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" disabled={loading}>
          {loading ? "Accesso in corso..." : "Accedi"}
        </Button>
      </form>
    </div>
  );
}
