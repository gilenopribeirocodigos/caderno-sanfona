-- Concede acesso às tabelas para usuários autenticados. A segurança por
-- linha (RLS, já criada em 0001_init.sql) garante que cada um só veja os
-- próprios dados; esta concessão apenas permite a operação ser tentada.
-- Necessário porque a opção "Automatically expose new tables" foi
-- desmarcada na criação do projeto (mais seguro, mas exige isso manualmente).

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.songs,
  public.notebooks,
  public.notebook_songs,
  public.song_versions,
  public.practice_history,
  public.settings
to authenticated;
