export type MovimentoTipo = "acquisto" | "vendita";

export interface Oggetto {
  id: string;
  nome: string;
  prezzo: number;
  quantita: number;
  foto_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Movimento {
  id: string;
  oggetto_id: string;
  tipo: MovimentoTipo;
  quantita: number;
  prezzo_unitario: number;
  totale: number;
  data: string;
  oggetti?: {
    nome: string;
  } | null;
}

export interface DashboardSummary {
  valoreTotale: number;
  numeroOggetti: number;
  totaleSpeso: number;
  totaleIncassato: number;
  saldoNetto: number;
}
