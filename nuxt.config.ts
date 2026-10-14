import { countCardWords } from '@froq/og-covers-layer/card-words'
import { keepEmptyTitle } from './shared/empty-title'
import { markFinalStop } from './shared/final-mark'
import { listPublicShareImages } from './shared/public-files'
import { IMAGE_ORIGIN } from './shared/site'

export default defineNuxtConfig({
  extends: [
    ['github:0froq/og-layer#v0.1.0', { install: true }],
  ],

  compatibilityDate: '2026-09-19',

  hooks: {
    // Notes and docs have no `::final`; the stop that ends the text blooms instead.
    // An explicit `title: ''` must stay empty: Content otherwise names the page after the file.
    'content:file:afterParse': ({ file, content, collection }) => {
      keepEmptyTitle(content, file.body)
      if (typeof file.body === 'string')
        (content as { words?: number }).words = countCardWords(file.body)
      if (collection.name === 'notes' || collection.name === 'docs')
        markFinalStop(content.body)
    },
  },

  runtimeConfig: {
    public: {
      publicFiles: listPublicShareImages(),
    },
  },

  build: { transpile: ['@froq/ui'] },

  modules: [
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxt/eslint',
  ],

  // DevTools hosts the OG Image tab (template hot reload). The host package is not a module.
  devtools: { enabled: true },

  // `og:image` is absolute on this origin. `og:url` stays on circle.froq.me via useShareMeta.
  // X does not fetch images from froq.me.
  site: {
    url: IMAGE_ORIGIN,
    name: 'circle',
  },

  css: [
    '@fontsource-variable/geist/index.css',
    '@fontsource-variable/geist-mono/index.css',
    '@fontsource/instrument-serif/400.css',
    '@fontsource/instrument-serif/400-italic.css',
    '~/assets/css/kit.css',
    '@froq/ui/style.css',
  ],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
      meta: [{ name: 'color-scheme', content: 'light dark' }],
      // Picks the theme before first paint so the paper never flashes the wrong stock
      script: [{
        tagPosition: 'head',
        innerHTML: `try{var t=localStorage.getItem('kit-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}`,
      }],
    },
  },

  content: {
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        highlight: {
          theme: { default: 'vitesse-light', dark: 'vitesse-dark' },
          langs: ['ts', 'js', 'vue', 'bash', 'json', 'yaml', 'md'],
        },
      },
    },
  },

  i18n: {
    locales: [
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'zh', language: 'zh-CN', name: '中文', file: 'zh.json' },
      { code: 'ja', language: 'ja', name: '日本語', file: 'ja.json' },
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    // Matches `site.url` so site-config does not error. Canonical links are set in useShareMeta.
    baseUrl: IMAGE_ORIGIN,
  },

  nitro: {
    // Workers Builds sets WORKERS_CI; without this Nitro picks a Cloudflare
    // preset instead of writing a static dist for `cf deploy`.
    preset: 'static',
    output: {
      publicDir: 'dist',
    },
    prerender: {
      crawlLinks: true,
      routes: ['/', '/zh', '/ja'],
    },
  },

  typescript: { strict: true },

  eslint: { config: { standalone: false } },
})
