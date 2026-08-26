import StatusChecks from "@/components/StatusChecks";
import ResetFinanzeButton from "@/components/ResetFinanzeButton";

export default function StatusPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Status</h1>
        <p className="text-sm text-zinc-500">
          Verifica connessione al database, funzione RPC, storage e configurazione.
        </p>
        <StatusChecks />
      </div>

      <ResetFinanzeButton />
    </div>
  );
}
