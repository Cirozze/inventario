import MovimentiTable from "@/components/MovimentiTable";

export default function MovimentiPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Movimenti</h1>
      <p className="text-sm text-zinc-500">Registro storico di acquisti e vendite.</p>
      <MovimentiTable />
    </div>
  );
}
