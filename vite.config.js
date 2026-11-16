
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'prompt',

      manifest: {
        id: '/',
        name: 'SIMKUR',
        short_name: 'SIMKUR',
        description: 'Sistem Informasi Manajemen Kurikulum',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#7138d8',
        background_color: '#ffffff',

        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },

            includeAssets: [
        'favicon.svg',
        'icons.svg',
        'apple-touch-icon.png'
      ],

      workbox: {
  globPatterns: [
    'assets/**',
    'index.html',
    'registerSW.js'
  ],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
}
    })
  ],
})
