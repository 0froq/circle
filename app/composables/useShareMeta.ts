import {
  canonicalUrl,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
} from '#shared/site'

type ShareType = 'website' | 'article'

function filled(value: string | undefined | null): string | undefined {
  const text = value?.trim()
  return text || undefined
}

/**
 * Open Graph / Twitter tags for a page. Call from `app.vue` for site-wide
 * defaults; pages pass their own title and description to override.
 */
export function useShareMeta(options: {
  title?: MaybeRefOrGetter<string | undefined | null>
  description?: MaybeRefOrGetter<string | undefined | null>
  type?: MaybeRefOrGetter<ShareType | undefined>
} = {}): void {
  const route = useRoute()
  const { t } = useI18n()

  const title = computed(() => filled(toValue(options.title)) ?? t('site.title'))
  const description = computed(() => filled(toValue(options.description)) ?? t('circle.copyLead'))
  const type = computed(() => toValue(options.type) ?? 'website')
  const url = computed(() => canonicalUrl(route.path))

  useSeoMeta({
    description: () => description.value,
    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogType: () => type.value,
    ogSiteName: () => t('site.title'),
    ogUrl: () => url.value,
    ogImage: OG_IMAGE_URL,
    ogImageSecureUrl: OG_IMAGE_URL,
    ogImageType: 'image/png',
    ogImageWidth: OG_IMAGE_WIDTH,
    ogImageHeight: OG_IMAGE_HEIGHT,
    ogImageAlt: () => t('site.title'),
    twitterCard: 'summary_large_image',
    twitterTitle: () => title.value,
    twitterDescription: () => description.value,
    twitterImage: OG_IMAGE_URL,
  })

  useHead({
    link: [{ rel: 'canonical', href: () => url.value }],
  })
}
