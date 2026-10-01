<script setup lang="ts">
import type { Person } from '#shared/circle/types'
import { waitingLineIndex } from '#shared/circle/waiting'

const props = defineProps<{
  open: boolean
  person: Person | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

type NoteTab = 'mine' | 'theirs'

const panel = ref<HTMLElement>()
const tab = ref<NoteTab>('mine')
const backdropReady = ref(true)
let backdropTimer: number | undefined

const written = computed(() => props.person?.impression.trim() ?? '')
const theirsText = computed(() => props.person?.aboutMe?.trim() ?? '')
const mineText = computed(() => {
  const person = props.person
  if (!person)
    return ''
  return written.value || t(`circle.waiting.${waitingLineIndex(person.userId)}`)
})

watch(() => props.person?.userId, () => {
  tab.value = 'mine'
})

function chooseTab(next: NoteTab): void {
  if (next === 'theirs' && !theirsText.value)
    return
  tab.value = next
}

function onKey(event: KeyboardEvent): void {
  if (event.key === 'Escape')
    emit('close')
}

function onWheel(event: WheelEvent): void {
  if (event.deltaX === 0 && event.deltaY === 0)
    return
  const target = event.target
  if (target instanceof Node && panel.value?.contains(target))
    return
  emit('close')
}

watch(() => props.open, (isOpen) => {
  window.clearTimeout(backdropTimer)
  if (isOpen) {
    // A tap both opens the note and can land on the backdrop that just appeared.
    const coarse = window.matchMedia('(pointer: coarse)').matches
    backdropReady.value = !coarse
    if (coarse)
      backdropTimer = window.setTimeout(() => { backdropReady.value = true }, 400)
    nextTick(() => panel.value?.focus({ preventScroll: true }))
    window.addEventListener('wheel', onWheel, { passive: true })
    return
  }
  backdropReady.value = true
  window.removeEventListener('wheel', onWheel)
})

onBeforeUnmount(() => {
  window.clearTimeout(backdropTimer)
  window.removeEventListener('wheel', onWheel)
})

function requestClose(): void {
  if (!backdropReady.value)
    return
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="card">
      <div
        v-if="open && person"
        class="circle-card-root"
        @keydown="onKey"
      >
        <button
          type="button"
          class="circle-card-backdrop"
          :aria-label="t('circle.closeCard')"
          @click="requestClose"
        />
        <aside
          ref="panel"
          class="circle-card"
          role="dialog"
          aria-modal="true"
          :aria-label="person.name"
          tabindex="-1"
        >
          <div class="circle-card-person">
            <div class="circle-card-avatar-slot">
              <img
                class="circle-card-avatar"
                :src="person.avatar"
                :alt="person.name"
                width="72"
                height="72"
                referrerpolicy="no-referrer"
              >
            </div>
            <div>
              <h2 class="circle-card-name">
                {{ person.name }}
              </h2>
              <p class="circle-card-handle">
                @{{ person.handle }}
                <template v-if="person.status === 'unfollowed'">
                  · {{ t('circle.unfollowedTag') }}
                </template>
              </p>
              <ul
                v-if="person.platforms.length"
                class="circle-card-platforms"
              >
                <li
                  v-for="platform in person.platforms"
                  :key="platform.url"
                >
                  <a
                    :href="platform.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >{{ platform.name }}</a>
                </li>
              </ul>
            </div>
          </div>

          <div
            class="circle-card-tabs"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              class="circle-card-tab"
              :aria-selected="tab === 'mine'"
              @click="chooseTab('mine')"
            >
              {{ t('circle.tabMine') }}
            </button>
            <button
              type="button"
              role="tab"
              class="circle-card-tab"
              :aria-selected="tab === 'theirs'"
              :disabled="!theirsText"
              @click="chooseTab('theirs')"
            >
              {{ t('circle.tabTheirs') }}
            </button>
          </div>

          <p
            v-if="tab === 'mine'"
            class="circle-card-impression"
            :class="{ 'is-waiting': !written }"
            data-anchor="tagline"
          >
            {{ mineText }}
          </p>
          <p
            v-else
            class="circle-card-impression"
          >
            {{ theirsText }}
          </p>

          <section
            v-if="tab === 'mine' && person.timeline.length"
            class="circle-card-timeline"
            :aria-label="t('circle.timeline')"
          >
            <div class="circle-card-timeline-line" />
            <ul>
              <li
                v-for="entry in person.timeline"
                :key="`${entry.date}-${entry.text}`"
              >
                <time :datetime="entry.date">{{ entry.date }}</time>
                <span>{{ entry.text }}</span>
              </li>
            </ul>
          </section>

          <section
            v-if="tab === 'mine' && person.pinnedPosts.length"
            class="circle-card-posts"
            :aria-label="t('circle.pinnedPosts')"
          >
            <h3>{{ t('circle.pinnedPosts') }}</h3>
            <blockquote
              v-for="post in person.pinnedPosts"
              :key="post.url"
              class="circle-card-quote"
            >
              <p>{{ post.text }}</p>
              <footer>
                <time :datetime="post.date">{{ post.date }}</time>
                ·
                <a
                  :href="post.url"
                  target="_blank"
                  rel="noopener noreferrer"
                >{{ t('circle.postLink') }}</a>
              </footer>
            </blockquote>
          </section>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.circle-card-root {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: clamp(20px, 4vw, 56px);
}

.circle-card-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: color-mix(in srgb, var(--fg) 18%, transparent);
  cursor: pointer;
}

.circle-card {
  position: relative;
  width: min(420px, 100%);
  min-height: min(360px, 70vh);
  max-height: min(78vh, 640px);
  overflow: auto;
  overscroll-behavior: contain;
  background: var(--bg);
  border: 1px solid var(--line);
  padding: clamp(28px, 4vw, 40px);
  outline: none;
}

.circle-card-person {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 1.25rem;
}

.circle-card-avatar-slot {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 1px solid var(--line);
  box-sizing: content-box;
}

.circle-card-avatar {
  display: block;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  opacity: 0;
}

.circle-card-name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 400;
}

.circle-card-handle {
  margin: 0.15em 0 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.circle-card-platforms {
  list-style: none;
  padding: 0;
  margin: 0.5em 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.85rem;
}

.circle-card-platforms a {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.circle-card-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 0 0 1.25rem;
  border-bottom: 1px solid var(--line);
}

.circle-card-tab {
  margin: 0;
  padding: 0 0 10px;
  border: 0;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 0.92rem;
  cursor: pointer;
}

.circle-card-tab[aria-selected='true'] {
  color: var(--fg);
  box-shadow: inset 0 -1px 0 var(--fg);
}

.circle-card-tab:disabled {
  color: var(--faint);
  cursor: default;
}

.circle-card-impression {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.25rem;
  line-height: 1.45;
  margin: 0 0 1.5rem;
  padding-left: 0.25rem;
}

.circle-card-impression.is-waiting {
  color: var(--muted);
}

.circle-card-timeline {
  position: relative;
  margin-bottom: 1.5rem;
  padding-left: 20px;
}

.circle-card-timeline-line {
  position: absolute;
  left: 4px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: linear-gradient(var(--accent), var(--line));
  border-radius: 2px;
  opacity: 0.65;
}

.circle-card-timeline ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.circle-card-timeline li {
  margin-bottom: 0.85rem;
}

.circle-card-timeline time {
  display: block;
  font-size: 0.78rem;
  color: var(--muted);
  font-family: var(--font-meta);
}

.circle-card-posts h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 0 0 0.75rem;
}

.circle-card-quote {
  margin: 0 0 1rem;
  padding: 12px 14px;
  border-left: 3px solid var(--line);
  background: color-mix(in srgb, var(--faint) 35%, transparent);
}

.circle-card-quote p {
  margin: 0 0 0.5rem;
}

.circle-card-quote footer {
  font-size: 0.8rem;
  color: var(--muted);
}

.card-enter-active,
.card-leave-active {
  transition: opacity 0.7s var(--ease);
}

.card-enter-active .circle-card,
.card-leave-active .circle-card {
  transition: transform 0.9s var(--ease);
}

.card-enter-from,
.card-leave-to {
  opacity: 0;
}

.card-enter-from .circle-card,
.card-leave-to .circle-card {
  transform: translateY(10px);
}
</style>
