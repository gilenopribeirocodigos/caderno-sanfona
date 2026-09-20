# caderno-sanfona

Aplicativo de cifras, repertórios e estudo visual para sanfona, com editor de acordes, baixos, teclado e modo de execução.

Web app responsivo (PWA) — roda no navegador (celular, tablet, desktop) e pode ser instalado na tela inicial. Não é preciso loja de aplicativos para usar.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173` — isso funciona **apenas na sua máquina**, é só o servidor de desenvolvimento. Para outras pessoas acessarem, é preciso publicar (deploy) o app, veja abaixo.

## Deploy (hospedagem gratuita)

O app é 100% estático depois do build (`npm run build` gera a pasta `dist/`), então qualquer hospedagem de sites estáticos gratuita serve. O repositório já vem preparado (redirecionamentos de rota) para:

- **Vercel** (recomendado) — conecte o repositório GitHub em vercel.com, ele detecta Vite automaticamente (`npm run build`, saída `dist`).
- **Cloudflare Pages** — mesmo fluxo, sem limite de banda no plano grátis.
- **Netlify** — mesmo fluxo.
- **Render (Static Site)** — também funciona bem e não "dorme" como o plano grátis de Web Service do Render.

Em qualquer uma delas, o passo é: criar conta grátis → "New Project/Site" → conectar este repositório → build command `npm run build`, publish directory `dist`. A cada push na branch principal, o site é atualizado automaticamente.

## Roadmap (etapas de desenvolvimento)

1. Esqueleto do app (Vite + React + TS + Tailwind + PWA) — feito
2. Camada de dados local (IndexedDB via Dexie)
3. Biblioteca de músicas
4. Editor de cifras
5. Transposição de tom
6. Cadernos e repertórios
7. Modo Tocar (tela cheia, zoom, navegação)
8. Rolagem automática + Configurações
9. Modo Sanfona Visual (baixos 80/120 + teclado)
10. Supabase (login + sincronização em nuvem)
11. Deploy online gratuito
