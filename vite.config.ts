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
        navigateFallback: '/index.html',
        // o manifest dinâmico e a fila do Supabase nunca devem ser
        // servidos pelo shell cacheado
        navigateFallbackDenylist: [/\/manifest\.webmanifest$/, /^\/rest\//, /^\/auth\//],
      },
    }),
  ],
})
