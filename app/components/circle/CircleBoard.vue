<script setup lang="ts">
import type { BoardLayout } from '#shared/circle/layout'
import type { PeopleFile, Person } from '#shared/circle/types'
import { CENTER_MARK } from '#shared/circle/layout'

const props = defineProps<{
  center: PeopleFile['center']
  layout: BoardLayout
}>()

const emit = defineEmits<{
  select: [person: Person]
}>()

const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
const dragging = ref(false)
const lastPointer = ref({ x: 0, y: 0 })
const hovered = ref<Person | null>(null)

const viewBoxStr = computed(() => {
  const { minX, minY, width, height } = props.layout.viewBox
  return `${minX} ${minY} ${width} ${height}`
})

function onWheel(event: WheelEvent): void {
  event.preventDefault()
  const delta = event.deltaY > 0 ? 0.94 : 1.06
  scale.value = Math.min(2.2, Math.max(0.65, scale.value * delta))
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0)
    return
  const target = event.target as HTMLElement
  if (target.closest('button'))
    return
  dragging.value = true
  lastPointer.value = { x: event.clientX, y: event.clientY }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent): void {
  if (!dragging.value)
    return
  panX.value += event.clientX - lastPointer.value.x
  panY.value += event.clientY - lastPointer.value.y
  lastPointer.value = { x: event.clientX, y: event.clientY }
}

function onPointerUp(): void {
  dragging.value = false
}

function selectNode(person: Person): void {
  emit('select', person)
}

function onNodeKey(event: KeyboardEvent, person: Person): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectNode(person)
  }
}

const transformStyle = computed(() =>
  `translate(${panX.value}px, ${panY.value}px) scale(${scale.value})`,
)
</script>

<template>
  <div
    class="board"
    @wheel="onWheel"
  >
    <div
      class="board-stage"
      :style="{ transform: transformStyle }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <svg
        class="board-svg"
        :viewBox="viewBoxStr"
        role="img"
        aria-label="画板"
      >
        <g
          class="board-center"
          :transform="`translate(${CENTER_MARK.x} ${CENTER_MARK.y})`"
        >
          <image
            :href="center.avatar"
            width="72"
            height="72"
            x="-36"
            y="-36"
          />
          <text
            y="54"
            text-anchor="middle"
            class="board-center-label"
          >{{ center.name }}</text>
        </g>

        <g
          v-for="node in layout.nodes"
          :key="node.person.userId"
          :transform="`translate(${node.x} ${node.y})`"
          class="board-node"
          :class="{ 'is-unfollowed': node.person.status === 'unfollowed' }"
        >
          <foreignObject
            :x="-node.size / 2"
            :y="-node.size / 2"
            :width="node.size"
            :height="node.size"
          >
            <button
              type="button"
              class="board-face"
              :aria-label="`${node.person.name} @${node.person.handle}`"
              tabindex="0"
              @click="selectNode(node.person)"
              @keydown="onNodeKey($event, node.person)"
              @pointerenter="hovered = node.person"
              @pointerleave="hovered = null"
              @focus="hovered = node.person"
              @blur="hovered = null"
            >
              <img
                :src="node.person.avatar"
                :alt="node.person.name"
                :width="node.size"
                :height="node.size"
                loading="lazy"
                decoding="async"
              >
            </button>
          </foreignObject>
        </g>
      </svg>

      <Transition name="fade">
        <div
          v-if="hovered"
          class="board-caption"
          role="status"
        >
          <span>{{ hovered.name }}</span>
          <span class="board-caption-handle">@{{ hovered.handle }}</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.board {
  position: relative;
  width: 100%;
  min-height: min(78vh, 760px);
  touch-action: none;
  cursor: grab;
}

.board:active {
  cursor: grabbing;
}

.board-stage {
  min-height: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  position: relative;
}

.board-svg {
  width: min(100%, 920px);
  height: auto;
  display: block;
}

.board-center-label {
  font-family: var(--font-display);
  font-size: 15px;
  fill: var(--fg);
}

.board-face {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--bg);
  cursor: pointer;
  overflow: hidden;
}

.board-face:hover,
.board-face:focus-visible {
  border-color: var(--fg);
  outline: none;
}

.board-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.board-node.is-unfollowed .board-face {
  opacity: 0.38;
  filter: grayscale(1);
}

.board-caption {
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  display: flex;
  gap: 0.6em;
  align-items: baseline;
  font-family: var(--font-display);
  font-size: 1.15rem;
  pointer-events: none;
}

.board-caption-handle {
  color: var(--muted);
  font-family: var(--font-text);
  font-size: 0.85rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s var(--ease);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
