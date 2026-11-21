-- Inversão (Fund/1ª/2ª...) salva por acorde, pra cada música — item 183.
-- Como aplicar: Supabase Dashboard → SQL Editor → cole este arquivo → Run.

alter table public.songs add column if not exists chord_voicings jsonb;
