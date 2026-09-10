import { z } from "zod";

// La quantita' non e' impostabile qui: un oggetto nuovo parte sempre da 0 e
// cambia solo tramite i movimenti (acquisto/vendita) registrati in Inventario.
export const oggettoInputSchema = z.object({
  nome: z.string().trim().min(1, "Il nome e' obbligatorio"),
  prezzo: z.coerce.number().min(0, "Il prezzo non puo' essere negativo"),
  unita: z.enum(["pezzi", "grammi"]).default("pezzi"),
  foto_url: z.string().url().nullable().optional(),
});

export const oggettoUpdateSchema = oggettoInputSchema.partial();

export const movimentoInputSchema = z.object({
  oggetto_id: z.string().uuid("Oggetto non valido"),
  tipo: z.enum(["acquisto", "vendita"]),
  quantita: z.coerce
    .number()
    .int("La quantita' deve essere un numero intero")
    .positive("La quantita' deve essere maggiore di zero"),
  prezzo_unitario: z.coerce.number().min(0, "Il prezzo unitario non puo' essere negativo"),
});

export const movimentoUpdateSchema = z.object({
  prezzo_unitario: z.coerce.number().min(0, "Il prezzo unitario non puo' essere negativo"),
});
