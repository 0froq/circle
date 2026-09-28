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

const panX = ref(0)
const panY = ref(0)
const scale = ref(1)
const hovered = ref<{ name: string, handle: string } | null>(null)

const stageStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${scale.value})`,
}))

let dragging = false
let moved = false
let lastX = 0
let lastY = 0

function place(face: Face): { left: string, top: string, width: string } {
  const box = packed.value.bounds
  return {
    left: `${((face.x - box.minX) / box.width) * 100}%`,
    top: `${((face.y - box.minY) / box.height) * 100}%`,
    width: `${(face.d / box.width) * 100}%`,
  }
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0)
    return
  moved = false
  const target = event.target as HTMLElement
  if (target.closest('button'))
    return
  dragging = true
  lastX = event.clientX
  lastY = event.clientY
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent): void {
  if (!dragging)
    return
  const dx = event.clientX - lastX
  const dy = event.clientY - lastY
  if (Math.hypot(dx, dy) > 3)
    moved = true
  lastX = event.clientX
  lastY = event.clientY
  panX.value += dx
  panY.value += dy
}

function onPointerUp(): void {
  dragging = false
}

function onWheel(event: WheelEvent): void {
  event.preventDefault()
  const next = scale.value * (event.deltaY > 0 ? 0.94 : 1.06)
  scale.value = Math.min(2.4, Math.max(0.7, next))
}

function choose(person: Person): void {
  if (moved)
    return
  emit('select', person)
}

function show(face: Face): void {
  hovered.value = { name: face.name, handle: face.handle }
}
</script>

<template>
  <div class="sponsor">
    <div
      class="board"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel="onWheel"
    >
      <div
        class="board-stage"
        :style="stageStyle"
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
              :alt="face.name"
              width="64"
              height="64"
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
  touch-action: none;
  cursor: grab;
}

.board:active {
  cursor: grabbing;
}

.board-stage {
  position: absolute;
  inset: 0;
  transform-origin: center center;
}

.board-face {
  position: absolute;
  transform: translate(-50%, -50%);
  aspect-ratio: 1;
  height: auto;
  border: 0;
  border-radius: 50%;
  padding: 0;
  overflow: hidden;
  background: var(--bg);
  cursor: pointer;
}

.board-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 50%;
}

.board-face:hover,
.board-face:focus-visible {
  z-index: 2;
  outline: 2px solid var(--fg);
  outline-offset: 2px;
}

.board-face.is-unfollowed {
  opacity: 0.42;
  filter: grayscale(1);
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
