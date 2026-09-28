<script setup lang="ts">
import type { DisplayRing, PlacedPerson } from '#shared/circle/types'

const props = defineProps<{
  groups: Map<DisplayRing, PlacedPerson[]>
  showUnfollowed: boolean
}>()

const { t } = useI18n()

const rings = [1, 2, 3, 4] as const

function visibleInGroup(ring: DisplayRing): PlacedPerson[] {
  const list = props.groups.get(ring) ?? []
  if (props.showUnfollowed)
    return list
  return list.filter(p => p.status !== 'unfollowed')
}
</script>

<template>
  <section
    class="circle-a11y"
    aria-label="按圈层列出"
  >
    <h2 class="circle-a11y-title">
      {{ t('circle.a11yTitle') }}
    </h2>
    <details
      v-for="ring in rings"
      :key="ring"
      class="circle-a11y-ring"
      :open="ring === 1"
    >
      <summary>{{ t('circle.ringSummary', { n: ring }) }}</summary>
      <ul v-if="visibleInGroup(ring).length">
        <li
          v-for="person in visibleInGroup(ring)"
          :key="person.userId"
        >
          <span>{{ person.name }}</span>
          <span class="circle-a11y-handle">@{{ person.handle }}</span>
          <span
            v-if="person.status === 'unfollowed'"
            class="circle-a11y-muted"
          >（{{ t('circle.unfollowedTag') }}）</span>
        </li>
      </ul>
      <p
        v-else
        class="circle-a11y-empty"
      >
        {{ t('circle.ringEmpty') }}
      </p>
    </details>
  </section>
</template>

<style scoped>
.circle-a11y {
  margin-top: clamp(40px, 8vw, 72px);
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.circle-a11y-title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 1rem;
  color: var(--muted);
}

.circle-a11y-ring {
  margin-bottom: 0.75rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.35rem 0.75rem 0.75rem;
}

.circle-a11y-ring summary {
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 1.1rem;
  padding: 0.35rem 0;
}

.circle-a11y-ring ul {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
}

.circle-a11y-ring li {
  padding: 0.35rem 0;
  border-top: 1px solid var(--line);
}

.circle-a11y-handle {
  color: var(--muted);
  margin-left: 0.5em;
  font-size: 0.9rem;
}

.circle-a11y-muted {
  color: var(--muted);
  font-size: 0.85rem;
}

.circle-a11y-empty {
  margin: 0.5rem 0 0;
  color: var(--muted);
  font-size: 0.9rem;
}
</style>
