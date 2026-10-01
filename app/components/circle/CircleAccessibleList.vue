<script setup lang="ts">
import type { Person } from '#shared/circle/types'

const props = defineProps<{
  people: Person[]
}>()

const emit = defineEmits<{
  select: [person: Person]
}>()

const { t } = useI18n()

const open = ref(false)
const query = ref('')
const trigger = ref<HTMLButtonElement>()
const field = ref<HTMLInputElement>()
const place = ref({ left: '16px', bottom: '16px' })

const matches = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  if (!needle)
    return props.people
  return props.people.filter(person =>
    person.name.toLocaleLowerCase().includes(needle)
    || person.handle.toLocaleLowerCase().includes(needle),
  )
})

function measure(): void {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect)
    return
  const width = Math.min(380, window.innerWidth - 32)
  const left = Math.min(rect.left, Math.max(16, window.innerWidth - 16 - width))
  place.value = {
    left: `${left}px`,
    bottom: `${window.innerHeight - rect.top + 10}px`,
  }
}

function onKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !open.value)
    return
  event.preventDefault()
  open.value = false
}

async function toggle(): Promise<void> {
  open.value = !open.value
  if (!open.value)
    return
  query.value = ''
  await nextTick()
  measure()
  field.value?.focus()
}

function choose(person: Person): void {
  open.value = false
  emit('select', person)
}

watch(open, (isOpen) => {
  if (isOpen) {
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', measure)
    return
  }
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', measure)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', measure)
})

const panelStyle = computed(() => ({
  left: place.value.left,
  bottom: place.value.bottom,
}))
</script>

<template>
  <button
    ref="trigger"
    type="button"
    class="names-open"
    :aria-expanded="open"
    @click="toggle"
  >
    {{ t('circle.a11yTitle') }}
  </button>
  <Teleport to="body">
    <div
      v-if="open"
      class="names-root"
    >
      <button
        type="button"
        class="names-backdrop"
        :aria-label="t('circle.closeCard')"
        @click="open = false"
      />
      <div
        class="names-panel"
        role="dialog"
        aria-modal="true"
        :aria-label="t('circle.a11yTitle')"
        :style="panelStyle"
      >
        <input
          ref="field"
          v-model="query"
          class="names-search"
          type="search"
          :placeholder="t('circle.searchNames')"
          :aria-label="t('circle.searchNames')"
        >
        <p
          v-if="matches.length === 0"
          class="names-empty"
        >
          {{ t('circle.searchEmpty') }}
        </p>
        <ul v-else>
          <li
            v-for="person in matches"
            :key="person.userId"
          >
            <button
              type="button"
              class="names-person"
              @click="choose(person)"
            >
              <span>{{ person.name }}</span>
              <span class="names-handle">@{{ person.handle }}</span>
              <span
                v-if="person.status === 'unfollowed'"
                class="names-handle"
              >· {{ t('circle.unfollowedTag') }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.names-open {
  margin-top: 0.25rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 0.92rem;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.names-open:hover {
  color: var(--fg);
}

.names-root {
  position: fixed;
  inset: 0;
  z-index: 35;
}

.names-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.names-panel {
  position: absolute;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(380px, calc(100vw - 32px));
  max-height: min(520px, 62dvh);
  padding: 14px 14px 8px;
  background: var(--bg);
  border: 1px solid var(--line);
}

.names-search {
  width: 100%;
  margin: 0 0 8px;
  padding: 8px 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
  color: var(--fg);
  font: inherit;
  font-size: 0.95rem;
  outline: none;
}

.names-search::placeholder {
  color: var(--muted);
}

.names-panel ul {
  list-style: none;
  margin: 0;
  padding: 4px 0 6px;
  overflow: auto;
}

.names-person {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15em 0.45em;
  width: 100%;
  padding: 0.45rem 0;
  border: 0;
  background: none;
  color: var(--fg);
  font: inherit;
  font-size: 0.95rem;
  text-align: left;
  cursor: pointer;
}

.names-person:hover {
  color: var(--accent);
}

.names-handle,
.names-empty {
  color: var(--muted);
}

.names-empty {
  margin: 0.75rem 0;
  font-size: 0.92rem;
}
</style>
