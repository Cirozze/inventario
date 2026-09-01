import type { UnitaMisura } from "@/types";

export function formatUnita(unita: UnitaMisura): string {
  return unita === "grammi" ? "g" : "pz";
}

export const UNITA_OPTIONS: { value: UnitaMisura; label: string }[] = [
  { value: "pezzi", label: "Pezzi" },
  { value: "grammi", label: "Grammi" },
];
