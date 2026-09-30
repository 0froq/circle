<script setup lang="ts">
import type { Person } from '#shared/circle/types'

defineProps<{
  people: Person[]
}>()

const { t } = useI18n()
</script>

<template>
  <details class="board-list">
    <summary>{{ t('circle.a11yTitle') }}</summary>
    <ul>
      <li
        v-for="person in people"
        :key="person.userId"
      >
        <span>{{ person.name }}</span>
        <span class="board-list-handle">@{{ person.handle }}</span>
        <span
          v-if="person.status === 'unfollowed'"
          class="board-list-muted"
        >（{{ t('circle.unfollowedTag') }}）</span>
      </li>
    </ul>
  </details>
</template>

<style scoped>
.board-list {
  margin-top: 2.5rem;
  color: var(--muted);
  font-size: 0.92rem;
}

.board-list summary {
  cursor: pointer;
}

.board-list ul {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  columns: 2;
  max-width: 40em;
}

.board-list li {
  break-inside: avoid;
  padding: 0.2rem 0;
  color: var(--fg);
}

.board-list-handle,
.board-list-muted {
  color: var(--muted);
  margin-left: 0.4em;
}

@media (max-width: 640px) {
  .board-list ul {
    columns: 1;
  }
}
</style>
