-- Schema per l'app di inventario personale.
-- Esegui questo file nel SQL editor di Supabase.

create extension if not exists pgcrypto;

-- ============================================================
-- Tabella oggetti
-- ============================================================
do $$ begin
  create type unita_misura as enum ('pezzi', 'grammi');
exception
  when duplicate_object then null;
end $$;

create table if not exists oggetti (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  prezzo numeric(12,2) not null default 0 check (prezzo >= 0),
  quantita integer not null default 0 check (quantita >= 0),
  unita unita_misura not null default 'pezzi',
  foto_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Se la tabella esisteva gia' senza la colonna unita' (deploy precedenti),
-- la aggiunge senza toccare i dati esistenti.
alter table oggetti add column if not exists unita unita_misura not null default 'pezzi';

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_oggetti_updated_at on oggetti;
create trigger trg_oggetti_updated_at
before update on oggetti
for each row execute function set_updated_at();

-- ============================================================
-- Tabella movimenti (log storico acquisti/vendite)
-- ============================================================
do $$ begin
  create type movimento_tipo as enum ('acquisto', 'vendita');
exception
  when duplicate_object then null;
end $$;

create table if not exists movimenti (
  id uuid primary key default gen_random_uuid(),
  oggetto_id uuid not null references oggetti(id) on delete cascade,
  tipo movimento_tipo not null,
  quantita integer not null check (quantita > 0),
  prezzo_unitario numeric(12,2) not null check (prezzo_unitario >= 0),
  totale numeric(12,2) not null,
  data timestamptz not null default now()
);

create index if not exists idx_movimenti_oggetto_id on movimenti(oggetto_id);
create index if not exists idx_movimenti_data on movimenti(data desc);

-- ============================================================
-- Row Level Security: nessuna policy pubblica.
-- L'app usa esclusivamente la service_role key lato server,
-- che bypassa RLS. Con RLS abilitata e nessuna policy, un'eventuale
-- chiave anon esposta per errore non avrebbe comunque alcun accesso.
-- ============================================================
alter table oggetti enable row level security;
alter table movimenti enable row level security;

-- ============================================================
-- Funzione transazionale per registrare un movimento (acquisto/vendita).
-- Valida i dati, aggiorna la quantita' dell'oggetto e inserisce la riga
-- di log in un'unica transazione atomica (con lock di riga FOR UPDATE
-- per evitare race condition su letture concorrenti dello stock).
-- Il prezzo_unitario e' sempre passato come parametro esplicito, mai
-- ricalcolato/hardcoded, cosi' in futuro potra' essere reso modificabile
-- liberamente dal form.
-- ============================================================
create or replace function registra_movimento(
  p_oggetto_id uuid,
  p_tipo movimento_tipo,
  p_quantita integer,
  p_prezzo_unitario numeric
) returns movimenti as $$
declare
  v_stock integer;
  v_totale numeric(12,2);
  v_movimento movimenti;
begin
  if p_quantita <= 0 then
    raise exception 'La quantita deve essere maggiore di zero';
  end if;
  if p_prezzo_unitario < 0 then
    raise exception 'Il prezzo unitario non puo essere negativo';
  end if;

  select quantita into v_stock from oggetti where id = p_oggetto_id for update;
  if not found then
    raise exception 'Oggetto non trovato';
  end if;

  if p_tipo = 'vendita' then
    if v_stock < p_quantita then
      raise exception 'Stock insufficiente: disponibili %, richiesti %', v_stock, p_quantita;
    end if;
    update oggetti set quantita = quantita - p_quantita where id = p_oggetto_id;
  else
    update oggetti set quantita = quantita + p_quantita where id = p_oggetto_id;
  end if;

  v_totale := p_quantita * p_prezzo_unitario;

  insert into movimenti (oggetto_id, tipo, quantita, prezzo_unitario, totale)
  values (p_oggetto_id, p_tipo, p_quantita, p_prezzo_unitario, v_totale)
  returning * into v_movimento;

  return v_movimento;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Elimina un movimento annullandone l'effetto sulla scorta, come se non
-- fosse mai stato registrato (un acquisto viene sottratto, una vendita
-- riaggiunta). Blocca la riga oggetti per evitare race condition, e
-- rifiuta l'eliminazione se annullare un acquisto porterebbe la scorta
-- sotto zero (segno che quello stock e' gia' stato in parte rivenduto).
-- ============================================================
create or replace function elimina_movimento(
  p_movimento_id uuid
) returns void as $$
declare
  v_movimento movimenti;
  v_stock integer;
begin
  select * into v_movimento from movimenti where id = p_movimento_id;
  if not found then
    raise exception 'Movimento non trovato';
  end if;

  select quantita into v_stock from oggetti where id = v_movimento.oggetto_id for update;
  if not found then
    raise exception 'Oggetto non trovato';
  end if;

  if v_movimento.tipo = 'acquisto' then
    if v_stock < v_movimento.quantita then
      raise exception 'Impossibile eliminare: parte di questo acquisto risulta gia'' venduta';
    end if;
    update oggetti set quantita = quantita - v_movimento.quantita where id = v_movimento.oggetto_id;
  else
    update oggetti set quantita = quantita + v_movimento.quantita where id = v_movimento.oggetto_id;
  end if;

  delete from movimenti where id = p_movimento_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Storage: crea manualmente (o via questo blocco) un bucket pubblico
-- per le foto degli oggetti. Nome di default: foto-oggetti
-- (deve corrispondere a SUPABASE_STORAGE_BUCKET nel .env)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('foto-oggetti', 'foto-oggetti', true)
on conflict (id) do nothing;

-- ============================================================
-- Tabella impostazioni (riga singola): marca il punto da cui
-- ricalcolare speso/incassato/saldo netto, senza toccare lo storico
-- movimenti (che resta sempre visibile per intero in Movimenti) ne'
-- le quantita' in scorta degli oggetti.
-- ============================================================
create table if not exists impostazioni (
  id boolean primary key default true,
  saldo_reset_at timestamptz,
  constraint impostazioni_singleton check (id)
);

alter table impostazioni enable row level security;

insert into impostazioni (id) values (true)
on conflict (id) do nothing;
