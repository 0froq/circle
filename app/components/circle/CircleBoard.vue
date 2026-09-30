<script setup lang="ts">
import type { Person } from '#shared/circle/types'
import { faceRadius, packBounds, packCircles } from '#shared/circle/pack'

const props = defineProps<{
  people: Person[]
}>()

const emit = defineEmits<{
  select: [person: Person]
}>()

interface Face {
  id: string
  name: string
  handle: string
  avatar: string
  person: Person
  unfollowed: boolean
  x: number
  y: number
  d: number
}

const packed = computed(() => {
  const peak = props.people.reduce((max, person) => Math.max(max, person.interactions), 0)
  const discs = props.people.map(person => ({ id: person.userId, r: faceRadius(person.interactions, peak) }))
  const layout = packCircles(discs)
  const bounds = packBounds(layout)
  const at = new Map(layout.map(disc => [disc.id, disc]))
  const faces: Face[] = []
  for (const person of props.people) {
    const disc = at.get(person.userId)!
    faces.push({
      id: person.userId,
      name: person.name,
      handle: person.handle,
      avatar: person.avatar,
      person,
      unfollowed: person.status === 'unfollowed',
      x: disc.x,
      y: disc.y,
      d: disc.r * 2,
    })
  }
  return { bounds, faces }
})

const HOVER_MIN = 120

const board = ref<HTMLElement>()
const stage = ref<HTMLElement>()
const boardWidth = ref(0)
const facesReady = ref(false)
const hovered = ref<{ name: string, handle: string } | null>(null)
let boardObserver: ResizeObserver | undefined

onMounted(() => {
  if (board.value) {
    boardObserver = new ResizeObserver(([entry]) => {
      boardWidth.value = entry?.contentRect.width ?? 0
    })
    boardObserver.observe(board.value)
  }
  const root = stage.value
  const images = root ? [...root.querySelectorAll('img')] : []
  if (images.length === 0) {
    facesReady.value = true
    return
  }
  let pending = images.length
  const done = (): void => {
    pending -= 1
    if (pending <= 0)
      facesReady.value = true
  }
  for (const img of images) {
    if (img.complete) {
      done()
    }
    else {
      img.addEventListener('load', done, { once: true })
      img.addEventListener('error', done, { once: true })
    }
  }
})

onBeforeUnmount(() => {
  boardObserver?.disconnect()
})

function place(face: Face): Record<string, string> {
  const box = packed.value.bounds
  const rendered = boardWidth.value > 0 ? (face.d / box.width) * boardWidth.value : face.d
  return {
    'left': `${((face.x - box.minX) / box.width) * 100}%`,
    'top': `${((face.y - box.minY) / box.height) * 100}%`,
    'width': `${(face.d / box.width) * 100}%`,
    '--hover-scale': String(Math.max(1, HOVER_MIN / rendered)),
  }
}

function choose(person: Person): void {
  emit('select', person)
}

function show(face: Face): void {
  hovered.value = { name: face.name, handle: face.handle }
}
</script>

<template>
  <div class="sponsor">
    <div
      ref="board"
      class="board"
      :class="{ 'is-ready': facesReady }"
    >
      <div
        ref="stage"
        class="board-stage"
      >
        <template
          v-for="face in packed.faces"
          :key="face.id"
        >
          <button
            type="button"
            class="board-face"
            :class="{ 'is-unfollowed': face.unfollowed }"
            :style="place(face)"
            :aria-label="`${face.name} @${face.handle}`"
            @click="choose(face.person)"
            @pointerenter="show(face)"
            @pointerleave="hovered = null"
            @focus="show(face)"
            @blur="hovered = null"
          >
            <img
              :src="face.avatar"
              alt=""
              width="64"
              height="64"
              draggable="false"
            >
          </button>
        </template>
      </div>
    </div>
    <p
      class="board-label"
      :class="{ 'is-shown': hovered }"
    >
      <template v-if="hovered">
        <span>{{ hovered.name }}</span>
        <span class="board-handle">@{{ hovered.handle }}</span>
      </template>
    </p>
  </div>
</template>

<style scoped>
.sponsor {
  width: min(100%, 760px);
  margin: 0 auto;
}

.board {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
}

.board-stage {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.board.is-ready .board-stage {
  opacity: 1;
}

.board-face {
  position: absolute;
  transform: translate(-50%, -50%) scale(1);
  aspect-ratio: 1;
  height: auto;
  border: 0;
  border-radius: 50%;
  padding: 0;
  overflow: hidden;
  background: var(--bg);
  cursor: pointer;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
  transition:
    transform 0.22s var(--ease),
    opacity 0.22s var(--ease),
    filter 0.22s var(--ease);
}

.board-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 50%;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.board-face.is-unfollowed {
  opacity: 0.42;
  filter: grayscale(1);
}

.board:has(.board-face:hover) .board-face:not(:hover),
.board:has(.board-face:focus-visible) .board-face:not(:focus-visible) {
  opacity: 0.28;
  filter: blur(3px);
}

.board-face:hover,
.board-face:focus-visible {
  z-index: 3;
  opacity: 1;
  filter: none;
  transform: translate(-50%, -50%) scale(var(--hover-scale));
}

.board-label {
  min-height: 1.6em;
  margin: 0.75rem 0 0;
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.25rem;
}

.board-label:not(.is-shown) {
  visibility: hidden;
}

.board-handle {
  margin-left: 0.5em;
  color: var(--muted);
  font-family: var(--font-text);
  font-size: 0.85rem;
}
</style>
