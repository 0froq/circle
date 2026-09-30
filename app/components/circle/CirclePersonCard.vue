<script setup lang="ts">
import type { Person } from '#shared/circle/types'

const props = defineProps<{
  open: boolean
  person: Person | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const panel = ref<HTMLElement>()

watch(() => props.open, (isOpen) => {
  if (isOpen)
    nextTick(() => panel.value?.focus())
})

function onKey(event: KeyboardEvent): void {
  if (event.key === 'Escape')
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
          @click="emit('close')"
        />
        <aside
          ref="panel"
          class="circle-card"
          role="dialog"
          aria-modal="true"
          :aria-label="person.name"
          tabindex="-1"
        >
          <header class="circle-card-head">
            <img
              class="circle-card-avatar"
              :src="person.avatar"
              :alt="person.name"
              width="72"
              height="72"
            >
            <div>
              <h2 class="circle-card-name">
                {{ person.name }}
              </h2>
              <p class="circle-card-handle">
                @{{ person.handle }}
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
            <button
              type="button"
              class="circle-card-close"
              @click="emit('close')"
            >
              {{ t('circle.closeCard') }}
            </button>
          </header>

          <p
            class="circle-card-impression"
            data-anchor="tagline"
          >
            {{ person.impression }}
          </p>

          <section
            v-if="person.timeline.length"
            class="circle-card-timeline"
            aria-label="时间线"
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
            v-if="person.pinnedPosts.length"
            class="circle-card-posts"
            aria-label="精选帖子"
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
  display: flex;
  justify-content: flex-end;
}

.circle-card-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: color-mix(in srgb, var(--fg) 8%, transparent);
  cursor: pointer;
}

.circle-card {
  position: relative;
  width: min(420px, 100vw);
  max-height: 100vh;
  overflow: auto;
  background: var(--bg);
  border-left: 1px solid var(--line);
  padding: clamp(20px, 4vw, 32px);
  outline: none;
}

.circle-card-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: start;
  margin-bottom: 1.25rem;
}

.circle-card-avatar {
  border-radius: 50%;
  border: 1px solid var(--line);
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

.circle-card-close {
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
}

.circle-card-impression {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.25rem;
  line-height: 1.45;
  margin: 0 0 1.5rem;
  padding-left: 0.25rem;
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
  transition: opacity 0.25s var(--ease);
}

.card-enter-active .circle-card,
.card-leave-active .circle-card {
  transition: transform 0.3s var(--ease);
}

.card-enter-from,
.card-leave-to {
  opacity: 0;
}

.card-enter-from .circle-card,
.card-leave-to .circle-card {
  transform: translateX(100%);
}

@media (max-width: 640px) {
  .circle-card-root {
    align-items: flex-end;
  }

  .circle-card {
    width: 100%;
    max-height: min(78vh, 520px);
    border-left: 0;
    border-top: 1px solid var(--line);
  }

  .card-enter-from .circle-card,
  .card-leave-to .circle-card {
    transform: translateY(100%);
  }
}
</style>
