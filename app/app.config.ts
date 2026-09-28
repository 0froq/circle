import type { ProductConfig } from './types'

export default defineAppConfig({
  product: {
    name: 'circle',
    mark: '·',
    theme: {
      light: {
        bg: '#f4f2ec',
        fg: '#1a1917',
        muted: '#85837c',
        faint: '#cfccc3',
        line: 'rgba(26, 25, 23, 0.12)',
        accent: '#e8431f',
      },
      dark: {
        bg: '#111113',
        fg: '#f2f0ea',
        muted: '#918f88',
        faint: '#32312d',
        line: 'rgba(242, 240, 234, 0.1)',
        accent: '#ff6242',
      },
    },
    install: { href: '/' },
    nav: [],
    signature: { paper: true, line: false, hand: false, bloom: false, pointer: { dwell: 'wash', click: 'wash', dwellAfter: 1.2 } },
  } satisfies ProductConfig,
})
