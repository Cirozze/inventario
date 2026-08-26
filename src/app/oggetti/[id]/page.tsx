import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import OggettoForm from "@/components/OggettoForm";
import type { Oggetto } from "@/types";

interface Props {
  params: { id: string };
}

export default async function ModificaOggettoPage({ params }: Props) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("oggetti")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Modifica oggetto</h1>
      <OggettoForm oggetto={data as Oggetto} />
    </div>
  );
}
