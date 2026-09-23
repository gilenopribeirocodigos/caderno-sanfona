import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Versão legível (1.0, 1.1, 1.2...) mostrada no rodapé do app, para
// confirmar visualmente se um deploy novo já chegou ao ar. Vem do
// arquivo VERSION na raiz do projeto — atualizado a cada publicação.
const appVersion = readFileSync(new URL('./VERSION', import.meta.url), 'utf-8').trim()

// Web app responsivo (PWA): roda no navegador (celular, tablet, desktop),
// pode ser instalado na tela inicial e funciona offline via service worker.
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      // Etapa "Polimento final": app estabilizado, reativa o Service
      // Worker de verdade (funciona offline, fica instalável com ícone
      // próprio). `autoUpdate` + skipWaiting/clientsClaim faz a versão
      // nova assumir sozinha assim que publicada, sem o usuário precisar
      // desinstalar nada (era esse risco de "versão presa" que mantinha
      // o modo selfDestroying antes).
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Caderno de Sanfona',
        short_name: 'Sanfona',
        description:
          'Caderno digital de letras, cifras e repertórios para sanfoneiros.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Os áudios do Batuque (.wav) ficam de fora do cache de instalação
        // (são muitos megabytes ao todo) — em vez disso, cada som grava no
        // cache sozinho depois de tocado uma vez (runtimeCaching abaixo),
        // então o app instala rápido e os ritmos já usados funcionam
        // offline nas próximas vezes.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: {
              cacheName: 'batuque-audio',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: true,
  },
})
