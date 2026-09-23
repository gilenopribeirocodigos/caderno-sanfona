-- Exclusões duráveis para que outro aparelho não recrie registros antigos.
create table if not exists public.sync_deletions (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('songs', 'notebooks', 'notebook_songs')),
  record_id uuid not null,
  deleted_at timestamptz not null default now(),
  primary key (user_id, entity_type, record_id)
);

alter table public.sync_deletions enable row level security;

create policy "sync_deletions: owner full access" on public.sync_deletions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.sync_deletions to authenticated;

-- Um aparelho com uma versão antiga do aplicativo também não pode reenviar
-- uma música (ou caderno/vínculo) que já foi excluída em outro aparelho.
create function public.reject_deleted_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.sync_deletions
    where user_id = new.user_id
      and entity_type = tg_table_name
      and record_id = new.id
  ) then
    raise exception 'Registro excluído não pode ser recriado: % %', tg_table_name, new.id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger songs_reject_deleted before insert or update on public.songs
  for each row execute function public.reject_deleted_record();

create trigger notebooks_reject_deleted before insert or update on public.notebooks
  for each row execute function public.reject_deleted_record();

create trigger notebook_songs_reject_deleted before insert or update on public.notebook_songs
  for each row execute function public.reject_deleted_record();
