-- Links de vídeo (YouTube) e karaokê da música — botão "Mídia" no Tocar.
-- Como aplicar: Supabase Dashboard → SQL Editor → cole este arquivo → Run.

alter table public.songs add column if not exists video_url text;
alter table public.songs add column if not exists karaoke_url text;
