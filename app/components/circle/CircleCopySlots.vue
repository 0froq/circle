<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <section
    class="circle-copy"
    :aria-label="t('circle.copyRegion')"
  >
    <p class="circle-copy-lead">
      {{ t('circle.copyLead') }}
    </p>
    <i18n-t
      keypath="circle.discussInvite"
      tag="p"
      class="circle-copy-invite"
    >
      <template #link>
        <a
          class="circle-copy-link"
          href="https://github.com/0froq/circle/discussions"
          target="_blank"
          rel="noopener noreferrer"
        >{{ t('circle.discussions') }}</a>
      </template>
    </i18n-t>
  </section>
</template>

<style scoped>
.circle-copy {
  margin-top: clamp(32px, 6vw, 56px);
  padding-top: 24px;
  border-top: 1px solid var(--line);
  max-width: 40em;
}

.circle-copy-lead,
.circle-copy-invite {
  font-family: var(--font-display);
  font-size: 1.35rem;
  margin: 0 0 1rem;
}

.circle-copy-invite {
  font-family: var(--font-text);
  font-size: 0.95rem;
  color: var(--muted);
}

.circle-copy-link {
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
