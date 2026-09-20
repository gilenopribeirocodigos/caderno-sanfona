import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Web app responsivo (PWA): roda no navegador (celular, tablet, desktop),
// pode ser instalado na tela inicial e funciona offline via service worker.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Desativado durante o desenvolvimento ativo: um Service Worker
      // real de cache atrapalha os testes de cada etapa (o navegador
      // mostra a versão antiga até o cache expirar). `selfDestroying`
      // publica um SW que só desinstala e limpa o cache de quem já
      // tinha instalado a versão anterior. Reativar (registerType:
      // 'autoUpdate') perto do fim do projeto, quando o app estabilizar.
      selfDestroying: true,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
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
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
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
