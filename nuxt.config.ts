// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@vite-pwa/nuxt'],

  app: {
    head: {
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icon-96.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icon-48.png' }
      ],
      meta: [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'ถามตอบสด' },
        { name: 'msapplication-TileColor', content: '#7c3aed' },
        { name: 'msapplication-TileImage', content: '/icon-144.png' }
      ]
    }
  },
  supabase: {
    redirect: false
  },
  css: ['~/assets/css/main.css'],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'กิจกรรมถามตอบสด',
      short_name: 'ถามตอบสด',
      description: 'แพลตฟอร์มนำเสนอแบบ Interactive — Poll, Quiz, Word Cloud แบบ Real-time',
      theme_color: '#7c3aed',
      background_color: '#0f0f1a',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      lang: 'th',
      icons: [
        { src: '/icon-48.png',           sizes: '48x48',     type: 'image/png', purpose: 'any' },
        { src: '/icon-72.png',           sizes: '72x72',     type: 'image/png', purpose: 'any' },
        { src: '/icon-96.png',           sizes: '96x96',     type: 'image/png', purpose: 'any' },
        { src: '/icon-128.png',          sizes: '128x128',   type: 'image/png', purpose: 'any' },
        { src: '/icon-144.png',          sizes: '144x144',   type: 'image/png', purpose: 'any' },
        { src: '/icon-152.png',          sizes: '152x152',   type: 'image/png', purpose: 'any' },
        { src: '/icon-167.png',          sizes: '167x167',   type: 'image/png', purpose: 'any' },
        { src: '/icon-180.png',          sizes: '180x180',   type: 'image/png', purpose: 'any' },
        { src: '/icon-192.png',          sizes: '192x192',   type: 'image/png', purpose: 'any' },
        { src: '/icon-256.png',          sizes: '256x256',   type: 'image/png', purpose: 'any' },
        { src: '/icon-384.png',          sizes: '384x384',   type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png',          sizes: '512x512',   type: 'image/png', purpose: 'any' },
        { src: '/icon-512-maskable.png', sizes: '512x512',   type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      // Cache strategies for offline support
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
      navigateFallback: null,
      runtimeCaching: [
        {
          // Supabase API — network-first (real-time data must be fresh)
          urlPattern: ({ url }) => url.hostname.includes('supabase'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-api',
            networkTimeoutSeconds: 5,
            cacheableResponse: { statuses: [0, 200] }
          }
        },
        {
          // Fonts & static assets — cache-first
          urlPattern: /\.(woff2?|ttf|otf|eot)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts',
            expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 }
          }
        }
      ]
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: false // keep devtools clean during local dev
    }
  }
})
