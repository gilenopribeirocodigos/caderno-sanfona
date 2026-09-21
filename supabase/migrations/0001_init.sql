-- Caderno de Sanfona — schema inicial do Supabase (Etapa 11: nuvem)
-- Espelha o banco local (Dexie/IndexedDB) descrito em src/lib/db.ts,
-- para que a sincronização seja um mapeamento direto entre os dois.
--
-- Como aplicar: Supabase Dashboard → SQL Editor → cole este arquivo → Run.

create extension if not exists "pgcrypto";

-- SONGS ----------------------------------------------------------------
create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text,
  original_key text not null,
  preferred_key text not null,
  lyrics text not null default '',
  chord_data jsonb not null default '{"chordProSource":"","lines":[]}',
  bpm int,
  rhythm text,
  time_signature text,
  difficulty text,
  notes text,
  tags text[] not null default '{}',
  favorite boolean not null default false,
  last_practiced_at timestamptz,
  times_played int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists songs_user_id_idx on songs(user_id);

-- NOTEBOOKS --------------------------------------------------------------
create table if not exists notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists notebooks_user_id_idx on notebooks(user_id);

-- NOTEBOOK_SONGS (posição de cada música dentro de um caderno) -----------
create table if not exists notebook_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notebook_id uuid not null references notebooks(id) on delete cascade,
  song_id uuid not null references songs(id) on delete cascade,
  position int not null
);

create index if not exists notebook_songs_notebook_id_idx on notebook_songs(notebook_id);
create unique index if not exists notebook_songs_unique on notebook_songs(notebook_id, song_id);

-- SONG_VERSIONS (item 12: versões alternativas da mesma música) ----------
create table if not exists song_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id uuid not null references songs(id) on delete cascade,
  name text not null,
  key text not null,
  lyrics text not null default '',
  chord_data jsonb not null default '{"chordProSource":"","lines":[]}',
  created_at timestamptz not null default now()
);

create index if not exists song_versions_song_id_idx on song_versions(song_id);

-- PRACTICE_HISTORY (item 29) ----------------------------------------------
create table if not exists practice_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id uuid not null references songs(id) on delete cascade,
  date timestamptz not null default now(),
  duration_seconds int,
  bpm int,
  notes text
);

create index if not exists practice_history_song_id_idx on practice_history(song_id);

-- SETTINGS (uma linha por usuário) ----------------------------------------
create table if not exists settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notation text not null default 'international',
  font_size int not null default 18,
  chord_size int not null default 18,
  theme text not null default 'light',
  auto_scroll_speed int not null default 0,
  accordion_type text not null default '120',
  help_level text not null default 'iniciante',
  external_controller_mapping jsonb not null default '{}'
);

-- ROW LEVEL SECURITY -------------------------------------------------------
-- Cada usuário só enxerga e altera os próprios dados.
alter table songs enable row level security;
alter table notebooks enable row level security;
alter table notebook_songs enable row level security;
alter table song_versions enable row level security;
alter table practice_history enable row level security;
alter table settings enable row level security;

create policy "songs: owner full access" on songs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notebooks: owner full access" on notebooks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notebook_songs: owner full access" on notebook_songs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "song_versions: owner full access" on song_versions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "practice_history: owner full access" on practice_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "settings: owner full access" on settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mantém updated_at em dia automaticamente nas músicas.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists songs_set_updated_at on songs;
create trigger songs_set_updated_at
  before update on songs
  for each row execute function set_updated_at();
