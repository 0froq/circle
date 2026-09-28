<script setup lang="ts">
import type { PeopleFile, Person } from '#shared/circle/types'
import { CENTER_MARK, layoutBoard } from '#shared/circle/layout'

const props = defineProps<{
  center: PeopleFile['center']
  people: Person[]
}>()

const emit = defineEmits<{
  select: [person: Person]
}>()

const layout = computed(() => layoutBoard(props.people))
const panX = ref(0)
const panY = ref(0)
const scale = ref(1)
const hovered = ref<Person | null>(null)

const aspect = computed(() => layout.value.viewBox.width / layout.value.viewBox.height)
const stageStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${scale.value})`,
}))

let dragging = false
let moved = false
let lastX = 0
let lastY = 0

function place(x: number, y: number, size: number): { left: string, top: string, width: string } {
  const box = layout.value.viewBox
  return {
    left: `${((x - box.minX) / box.width) * 100}%`,
    top: `${((y - box.minY) / box.height) * 100}%`,
    width: `${(size / box.width) * 100}%`,
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
  moved = false
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
  scale.value = Math.min(2.2, Math.max(0.65, next))
}

function choose(person: Person): void {
  if (moved)
    return
  emit('select', person)
}
</script>

<template>
  <div
    class="board"
    :style="{ aspectRatio: String(aspect) }"
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
      <div
        class="board-mark"
        :style="place(CENTER_MARK.x, CENTER_MARK.y, 64)"
      >
        <img
          :src="center.avatar"
          :alt="center.name"
          width="64"
          height="64"
        >
        <span>{{ center.name }}</span>
      </div>

      <button
        v-for="node in layout.nodes"
        :key="node.person.userId"
        type="button"
        class="board-face"
        :class="{ 'is-unfollowed': node.person.status === 'unfollowed' }"
        :style="place(node.x, node.y, node.size)"
        :aria-label="`${node.person.name} @${node.person.handle}`"
        @click="choose(node.person)"
        @pointerenter="hovered = node.person"
        @pointerleave="hovered = null"
        @focus="hovered = node.person"
        @blur="hovered = null"
      >
        <img
          :src="node.person.avatar"
          :alt="node.person.name"
          width="46"
          height="46"
        >
      </button>
    </div>

    <p
      v-if="hovered"
      class="board-label"
    >
      <span>{{ hovered.name }}</span>
      <span class="board-handle">@{{ hovered.handle }}</span>
    </p>
  </div>
</template>

<style scoped>
.board {
  position: relative;
  width: 100%;
  min-height: 420px;
  touch-action: none;
  cursor: grab;
  overflow: hidden;
}

.board:active {
  cursor: grabbing;
}

.board-stage {
  position: absolute;
  inset: 0;
  transform-origin: center center;
}

.board-mark,
.board-face {
  position: absolute;
  transform: translate(-50%, -50%);
  aspect-ratio: 1;
  border-radius: 50%;
  padding: 0;
  overflow: hidden;
}

.board-mark {
  display: grid;
  justify-items: center;
  border: 0;
  background: transparent;
  overflow: visible;
}

.board-mark img,
.board-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
  background: var(--bg);
}

.board-mark span {
  margin-top: 0.35rem;
  font-family: var(--font-display);
  font-size: 0.95rem;
  white-space: nowrap;
}

.board-face {
  border: 1px solid var(--line);
  background: var(--bg);
  cursor: pointer;
}

.board-face:hover,
.board-face:focus-visible {
  border-color: var(--fg);
  outline: none;
  z-index: 1;
}

.board-face.is-unfollowed {
  opacity: 0.4;
  filter: grayscale(1);
}

.board-label {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  margin: 0;
  display: flex;
  gap: 0.55em;
  align-items: baseline;
  font-family: var(--font-display);
  font-size: 1.15rem;
  pointer-events: none;
}

.board-handle {
  color: var(--muted);
  font-family: var(--font-text);
  font-size: 0.82rem;
}
</style>
