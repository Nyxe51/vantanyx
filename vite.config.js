import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Le site est publié sur https://<pseudo>.github.io/vantanyx/
// → tout doit être servi depuis le sous-dossier /vantanyx/
const BASE = '/vantanyx/';

export default defineConfig({
  base: BASE,
  plugins: [
    VitePWA({
      // 'prompt' : l'appli prévient quand une nouvelle version est prête (voir main.js), au lieu de changer en cachette.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Vantanyx – Stay Focus',
        short_name: 'Vantanyx',
        description: 'Reste focus sur tes objectifs, chaque jour.',
        lang: 'fr',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#030405',
        theme_color: '#030405',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Tout ce qui sert à afficher l'appli est mis en cache pour le mode hors ligne.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,json,webmanifest}'],
        navigateFallback: BASE + 'index.html',
      },
    }),
  ],
});
