# caderno-sanfona

App em produção: https://caderno-sanfona.gilenopribeiro.workers.dev

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

- **Cloudflare Pages** (recomendado) — banda **ilimitada** no plano grátis, mesmo para uso comercial, e nunca "dorme". É onde se consegue mais uso sem nunca precisar pagar.
- **Render (Static Site)** — alternativa sólida, também não dorme (isso só acontece no plano grátis de *Web Service* do Render, que não usamos aqui); tem teto de 100 GB de banda/mês, cobrando US$0,10/GB só do excedente.
- **Vercel** — funciona bem, mas o plano grátis (Hobby) tem 100 GB/mês com corte automático do site ao ultrapassar, e os termos restringem a uso pessoal/não-comercial.
- **Netlify** — parecido com Vercel, 100 GB/mês.

Em qualquer uma delas, o passo é: criar conta grátis → "New Project/Site" → conectar este repositório → build command `npm run build`, publish directory `dist`. A cada push na branch principal, o site é atualizado automaticamente.

Observação sobre o Supabase (banco de dados, Etapa 10): o plano grátis pausa o projeto sozinho após 7 dias sem nenhum uso — não é cobrança, só requer reativar pelo painel com 1 clique.

## Roadmap (etapas de desenvolvimento)

1. Esqueleto do app (Vite + React + TS + Tailwind + PWA) — feito
2. Deploy online gratuito (Cloudflare Pages/Workers) — feito
3. Camada de dados local (IndexedDB via Dexie)
4. Biblioteca de músicas
5. Editor de cifras
6. Transposição de tom
7. Cadernos e repertórios
8. Modo Tocar (tela cheia, zoom, navegação)
9. Rolagem automática + Configurações
10. Modo Sanfona Visual (baixos 80/120 + teclado)
11. Supabase (login + sincronização em nuvem)
