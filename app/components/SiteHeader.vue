<script setup lang="ts">
const { product } = useAppConfig()
const { t, locale, locales } = useI18n()
const link = useKitLink()
const switchLocalePath = useSwitchLocalePath()
const { sections, current, pinned } = usePageSections()

function languageLabel(code: string): string {
  switch (code) {
    case 'en':
      return 'EN'
    case 'zh':
      return '中文'
    case 'ja':
      return '日本語'
    default:
      return code
  }
}
</script>

<template>
  <header class="l-top">
    <NuxtLink
      class="l-brand"
      :to="link('/')"
    >
      <Fill
        :value="product.name"
        name="product.name"
        :size="4"
      /><span class="l-dot">{{ product.mark }}</span>
    </NuxtLink>
    <SectionNav
      v-if="sections.length"
      :sections="sections"
      :current="current"
    />
    <div class="l-top-end">
      <nav
        v-if="product.nav.length"
        class="l-nav"
      >
        <NuxtLink
          v-for="item in product.nav"
          :key="item.to"
          :to="link(item.to)"
        >
          {{ t(item.label) }}
        </NuxtLink>
      </nav>
      <nav
        class="l-lang"
        :aria-label="t('site.language')"
      >
        <NuxtLink
          v-for="l in locales"
          :key="l.code"
          :to="switchLocalePath(l.code)"
          :lang="l.language"
          :aria-current="l.code === locale ? 'true' : undefined"
          :class="{ 'is-current': l.code === locale }"
        >
          {{ languageLabel(l.code) }}
        </NuxtLink>
      </nav>
    </div>
    <Transition name="section-bar">
      <div
        v-if="pinned && sections.length"
        class="l-section-bar"
      >
        <SectionNav
          :sections="sections"
          :current="current"
        />
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.l-top-end {
  grid-column: 3;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 28px;
}

.l-lang {
  display: flex;
  border: 1px solid var(--line);
}

.l-lang a {
  padding: 5px 9px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: color 0.3s;
}

.l-lang a + a {
  border-inline-start: 1px solid var(--line);
}

.l-lang a:hover {
  color: var(--fg);
}

.l-lang a.is-current {
  color: var(--fg);
  background: color-mix(in srgb, var(--fg) 8%, transparent);
}

@media (max-width: 860px) {
  .l-top-end {
    grid-column: 2;
  }

  .l-nav {
    display: none;
  }
}
</style>
