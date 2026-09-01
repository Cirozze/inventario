export type MovimentoTipoDb = "acquisto" | "vendita";
export type UnitaMisuraDb = "pezzi" | "grammi";

export interface Database {
  public: {
    Tables: {
      oggetti: {
        Row: {
          id: string;
          nome: string;
          prezzo: number;
          quantita: number;
          unita: UnitaMisuraDb;
          foto_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          prezzo?: number;
          quantita?: number;
          unita?: UnitaMisuraDb;
          foto_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          prezzo?: number;
          quantita?: number;
          unita?: UnitaMisuraDb;
          foto_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      movimenti: {
        Row: {
          id: string;
          oggetto_id: string;
          tipo: MovimentoTipoDb;
          quantita: number;
          prezzo_unitario: number;
          totale: number;
          data: string;
        };
        Insert: {
          id?: string;
          oggetto_id: string;
          tipo: MovimentoTipoDb;
          quantita: number;
          prezzo_unitario: number;
          totale: number;
          data?: string;
        };
        Update: {
          id?: string;
          oggetto_id?: string;
          tipo?: MovimentoTipoDb;
          quantita?: number;
          prezzo_unitario?: number;
          totale?: number;
          data?: string;
        };
        Relationships: [
          {
            foreignKeyName: "movimenti_oggetto_id_fkey";
            columns: ["oggetto_id"];
            isOneToOne: false;
            referencedRelation: "oggetti";
            referencedColumns: ["id"];
          },
        ];
      };
      impostazioni: {
        Row: {
          id: boolean;
          saldo_reset_at: string | null;
        };
        Insert: {
          id?: boolean;
          saldo_reset_at?: string | null;
        };
        Update: {
          id?: boolean;
          saldo_reset_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      registra_movimento: {
        Args: {
          p_oggetto_id: string;
          p_tipo: MovimentoTipoDb;
          p_quantita: number;
          p_prezzo_unitario: number;
        };
        Returns: {
          id: string;
          oggetto_id: string;
          tipo: MovimentoTipoDb;
          quantita: number;
          prezzo_unitario: number;
          totale: number;
          data: string;
        };
      };
    };
    Enums: {
      movimento_tipo: MovimentoTipoDb;
      unita_misura: UnitaMisuraDb;
    };
    CompositeTypes: Record<string, never>;
  };
}
