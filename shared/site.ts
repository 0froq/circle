/** Production origin from README. Share tags need an absolute https URL. */
export const SITE_ORIGIN = 'https://circle.froq.me'

export const OG_IMAGE_PATH = '/og.png'
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

/** Absolute canonical URL. Trailing slashes drop, matching the Worker. */
export function canonicalUrl(path: string): string {
  const url = new URL(path || '/', `${SITE_ORIGIN}/`)
  const pathname = url.pathname.length > 1 && url.pathname.endsWith('/')
    ? url.pathname.replace(/\/+$/, '')
    : url.pathname
  return pathname === '/' ? SITE_ORIGIN : `${SITE_ORIGIN}${pathname}`
}
