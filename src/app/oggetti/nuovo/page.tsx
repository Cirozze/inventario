import OggettoForm from "@/components/OggettoForm";

export default function NuovoOggettoPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nuovo oggetto</h1>
      <OggettoForm />
    </div>
  );
}
