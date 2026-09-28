<script setup lang="ts">
import type { DisplayRing } from '#shared/circle/types'

const showUnfollowed = defineModel<boolean>('showUnfollowed', { required: true })
const ringFilter = defineModel<DisplayRing | null>('ringFilter', { required: true })

const { t } = useI18n()

const rings = [1, 2, 3, 4] as const

function toggleRing(ring: DisplayRing): void {
  ringFilter.value = ringFilter.value === ring ? null : ring
}
</script>

<template>
  <div
    class="circle-toolbar"
    role="toolbar"
    :aria-label="t('circle.toolbarLabel')"
  >
    <label class="circle-toggle">
      <input
        v-model="showUnfollowed"
        type="checkbox"
      >
      <span>{{ t('circle.showUnfollowed') }}</span>
    </label>
    <div class="circle-ring-filters">
      <span class="circle-ring-label">{{ t('circle.ringFilterLabel') }}</span>
      <button
        v-for="ring in rings"
        :key="ring"
        type="button"
        class="circle-ring-btn"
        :class="{ 'is-active': ringFilter === ring }"
        :aria-pressed="ringFilter === ring"
        @click="toggleRing(ring)"
      >
        {{ t('circle.ringOnly', { n: ring }) }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.circle-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  align-items: center;
  font-size: 0.92rem;
}

.circle-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--fg);
}

.circle-toggle input {
  accent-color: var(--accent);
}

.circle-ring-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.circle-ring-label {
  color: var(--muted);
  margin-right: 4px;
}

.circle-ring-btn {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--fg);
  border-radius: 999px;
  padding: 4px 12px;
  font: inherit;
  cursor: pointer;
  transition:
    border-color 0.2s var(--ease),
    color 0.2s var(--ease);
}

.circle-ring-btn:hover {
  border-color: var(--muted);
}

.circle-ring-btn.is-active {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
