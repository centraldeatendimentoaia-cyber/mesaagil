import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // O manifest é dinâmico por barraca (functions/[slug]/manifest.webmanifest.ts),
      // não um manifest.webmanifest estático — o plugin só cuida do service worker.
      manifest: false,
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // exceljs só carrega sob demanda (import dinâmico no botão Exportar
        // de Histórico) — é ~1MB, não vale precachear pra todo mundo que
        // nunca exporta nada
        // mesaagil-og.png só é usado por crawlers de link preview (WhatsApp,
        // redes sociais) — o app em si nunca carrega essa imagem, não vale
        // precachear pra instalação do PWA
        globIgnores: ['**/exceljs*.js', '**/mesaagil-og.png'],
        navigateFallback: '/index.html',
        // o manifest dinâmico e a fila do Supabase nunca devem ser
        // servidos pelo shell cacheado
        navigateFallbackDenylist: [/\/manifest\.webmanifest$/, /^\/rest\//, /^\/auth\//],
      },
    }),
  ],
})
