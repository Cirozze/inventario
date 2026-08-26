import Link from "next/link";
import OggettiList from "@/components/OggettiList";
import Button from "@/components/ui/Button";

export default function OggettiPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Oggetti</h1>
        <Link href="/oggetti/nuovo">
          <Button>Nuovo oggetto</Button>
        </Link>
      </div>
      <OggettiList />
    </div>
  );
}
