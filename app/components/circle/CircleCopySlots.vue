<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <section
    class="circle-copy"
    aria-label="说明与连接"
  >
    <p class="circle-copy-lead">
      {{ t('circle.copyLead') }}
    </p>
    <div class="circle-copy-connect">
      <span class="circle-copy-connect-label">{{ t('circle.connectLabel') }}</span>
      <a
        class="circle-copy-link"
        href="https://x.com/0froq"
        target="_blank"
        rel="noopener noreferrer"
      >X</a>
      <span class="circle-copy-sep">/</span>
      <span class="circle-copy-placeholder">{{ t('circle.wechatPlaceholder') }}</span>
    </div>
    <p class="circle-copy-revenue">
      {{ t('circle.revenueSlot') }}
    </p>
  </section>
</template>

<style scoped>
.circle-copy {
  margin-top: clamp(32px, 6vw, 56px);
  padding-top: 24px;
  border-top: 1px solid var(--line);
  max-width: 40em;
}

.circle-copy-lead {
  font-family: var(--font-display);
  font-size: 1.35rem;
  margin: 0 0 1rem;
}

.circle-copy-connect {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 1.25rem;
  font-size: 0.95rem;
}

.circle-copy-connect-label {
  color: var(--muted);
  margin-right: 4px;
}

.circle-copy-link {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.circle-copy-sep {
  color: var(--faint);
}

.circle-copy-placeholder {
  color: var(--muted);
  border: 1px dashed var(--line);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.88rem;
}

.circle-copy-revenue {
  margin: 0;
  color: var(--muted);
  font-size: 0.88rem;
  border: 1px dashed var(--faint);
  padding: 12px 14px;
  border-radius: 8px;
}
</style>
