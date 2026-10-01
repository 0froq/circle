<script setup lang="ts">
import type { Person } from '#shared/circle/types'
import type { BoardView } from '#shared/circle/viewport'
import { faceRadius, packBounds, packCircles } from '#shared/circle/pack'
import { clampPan, MIN_ZOOM, zoomToward } from '#shared/circle/viewport'

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

const HOVER_MIN = 96
const TAP_SLOP = 8

const board = ref<HTMLElement>()
const stage = ref<HTMLElement>()
const boardWidth = ref(0)
const facesReady = ref(false)
const hovered = ref<{ name: string, handle: string } | null>(null)
const coarse = ref(false)
const pickedId = ref<string | null>(null)
const dragging = ref(false)
const view = ref<BoardView>({ zoom: MIN_ZOOM, x: 0, y: 0 })

let boardObserver: ResizeObserver | undefined
let coarseMedia: MediaQueryList | undefined
const pointers = new Map<number, { x: number, y: number }>()
let drag: { id: number, x: number, y: number, panX: number, panY: number, moved: boolean } | null = null
let pinch: { zoom: number, x: number, y: number, dist: number, originX: number, originY: number } | null = null
let ignoreClick = false

const boardStyle = computed(() => ({
  touchAction: view.value.zoom > MIN_ZOOM ? 'none' : 'pan-y',
}))

const stageStyle = computed(() => ({
  transform: `translate(${view.value.x}px, ${view.value.y}px) scale(${view.value.zoom})`,
}))

onMounted(() => {
  if (board.value) {
    boardObserver = new ResizeObserver(([entry]) => {
      boardWidth.value = entry?.contentRect.width ?? 0
      view.value = fit(view.value)
    })
    boardObserver.observe(board.value)
    board.value.addEventListener('wheel', onWheel, { passive: false })
    board.value.addEventListener('touchmove', onTouchMove, { passive: false })
  }
  coarseMedia = window.matchMedia('(pointer: coarse)')
  syncStored()
  coarseMedia.addEventListener('change', syncStored)
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
  board.value?.removeEventListener('wheel', onWheel)
  board.value?.removeEventListener('touchmove', onTouchMove)
  coarseMedia?.removeEventListener('change', syncStored)
})

function syncStored(): void {
  coarse.value = coarseMedia?.matches ?? false
}

function fit(next: BoardView): BoardView {
  const size = boardWidth.value
  return {
    zoom: next.zoom,
    x: clampPan(next.x, size, next.zoom),
    y: clampPan(next.y, size, next.zoom),
  }
}

function place(face: Face): Record<string, string> {
  const box = packed.value.bounds
  const rendered = boardWidth.value > 0
    ? (face.d / box.width) * boardWidth.value * view.value.zoom
    : face.d
  return {
    'left': `${((face.x - box.minX) / box.width) * 100}%`,
    'top': `${((face.y - box.minY) / box.height) * 100}%`,
    'width': `${(face.d / box.width) * 100}%`,
    '--hover-scale': String(Math.max(1, HOVER_MIN / rendered)),
  }
}

function centerOf(clientX: number, clientY: number): { x: number, y: number } | null {
  const rect = board.value?.getBoundingClientRect()
  if (!rect)
    return null
  return {
    x: clientX - rect.left - rect.width / 2,
    y: clientY - rect.top - rect.height / 2,
  }
}

function choose(person: Person): void {
  if (ignoreClick) {
    ignoreClick = false
    return
  }
  if (coarse.value && pickedId.value !== person.userId) {
    pickedId.value = person.userId
    hovered.value = { name: person.name, handle: person.handle }
    return
  }
  emit('select', person)
}

function show(face: Face): void {
  if (dragging.value)
    return
  hovered.value = { name: face.name, handle: face.handle }
}

function hide(): void {
  if (coarse.value && pickedId.value)
    return
  hovered.value = null
}

function rememberPointer(event: PointerEvent): void {
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
}

function pinchGeometry(): { dist: number, originX: number, originY: number } | null {
  const points = [...pointers.values()]
  const first = points[0]
  const second = points[1]
  if (!first || !second)
    return null
  const midX = (first.x + second.x) / 2
  const midY = (first.y + second.y) / 2
  const origin = centerOf(midX, midY)
  if (!origin)
    return null
  return {
    dist: Math.hypot(first.x - second.x, first.y - second.y),
    originX: origin.x,
    originY: origin.y,
  }
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0)
    return
  rememberPointer(event)
  if (pointers.size >= 2) {
    drag = null
    dragging.value = true
    const geometry = pinchGeometry()
    if (geometry) {
      pinch = { zoom: view.value.zoom, x: view.value.x, y: view.value.y, ...geometry }
    }
    board.value?.setPointerCapture(event.pointerId)
    return
  }
  const zoomed = view.value.zoom > MIN_ZOOM
  if (coarse.value && !zoomed)
    return
  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    panX: view.value.x,
    panY: view.value.y,
    moved: false,
  }
}

function onPointerMove(event: PointerEvent): void {
  if (!pointers.has(event.pointerId))
    return
  rememberPointer(event)
  if (pointers.size >= 2 && pinch) {
    const geometry = pinchGeometry()
    if (!geometry || pinch.dist <= 0)
      return
    const size = board.value?.clientWidth ?? 0
    view.value = zoomToward(
      pinch,
      pinch.originX,
      pinch.originY,
      geometry.originX,
      geometry.originY,
      pinch.zoom * (geometry.dist / pinch.dist),
      size,
    )
    dragging.value = true
    return
  }
  if (!drag || drag.id !== event.pointerId)
    return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  if (!drag.moved && Math.hypot(dx, dy) < TAP_SLOP)
    return
  drag.moved = true
  dragging.value = true
  board.value?.setPointerCapture(event.pointerId)
  if (view.value.zoom <= MIN_ZOOM)
    return
  const size = board.value?.clientWidth ?? 0
  view.value = {
    zoom: view.value.zoom,
    x: clampPan(drag.panX + dx, size, view.value.zoom),
    y: clampPan(drag.panY + dy, size, view.value.zoom),
  }
}

function endGesture(moved: boolean): void {
  if (!moved)
    return
  ignoreClick = true
  window.setTimeout(() => {
    ignoreClick = false
  }, 0)
}

function onPointerUp(event: PointerEvent): void {
  const moved = (drag?.id === event.pointerId && drag.moved) || pinch !== null
  pointers.delete(event.pointerId)
  if (drag?.id === event.pointerId)
    drag = null
  if (pointers.size < 2)
    pinch = null
  if (pointers.size === 0)
    dragging.value = false
  endGesture(moved)
}

function onPointerCancel(event: PointerEvent): void {
  onPointerUp(event)
}

function onWheel(event: WheelEvent): void {
  const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY
  const factor = Math.exp(-delta * 0.0016)
  if (factor < 1 && view.value.zoom <= MIN_ZOOM)
    return
  event.preventDefault()
  const origin = centerOf(event.clientX, event.clientY)
  const size = board.value?.clientWidth ?? 0
  if (!origin)
    return
  view.value = zoomToward(view.value, origin.x, origin.y, origin.x, origin.y, view.value.zoom * factor, size)
}

function onTouchMove(event: TouchEvent): void {
  if (event.touches.length >= 2 || (dragging.value && view.value.zoom > MIN_ZOOM))
    event.preventDefault()
}
</script>

<template>
  <div class="sponsor">
    <div
      ref="board"
      class="board"
      :class="{ 'is-ready': facesReady, 'is-dragging': dragging, 'is-coarse': coarse }"
      :style="boardStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
    >
      <div
        ref="stage"
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
            :class="{ 'is-unfollowed': face.unfollowed, 'is-picked': coarse && pickedId === face.id }"
            :style="place(face)"
            :aria-label="`${face.name} @${face.handle}`"
            @click="choose(face.person)"
            @pointerenter="show(face)"
            @pointerleave="hide"
            @focus="show(face)"
            @blur="hide"
          >
            <img
              :src="face.avatar"
              alt=""
              width="64"
              height="64"
              draggable="false"
              referrerpolicy="no-referrer"
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
  --edge: clamp(48px, 14%, 88px);
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
  overscroll-behavior: contain;
  mask-image:
    linear-gradient(to right, transparent, #000 var(--edge), #000 calc(100% - var(--edge)), transparent),
    linear-gradient(to bottom, transparent, #000 var(--edge), #000 calc(100% - var(--edge)), transparent);
  mask-composite: intersect;
  -webkit-mask-image:
    linear-gradient(to right, transparent, #000 var(--edge), #000 calc(100% - var(--edge)), transparent),
    linear-gradient(to bottom, transparent, #000 var(--edge), #000 calc(100% - var(--edge)), transparent);
  -webkit-mask-composite: source-in;
}

.board::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  mask-image:
    linear-gradient(to right, #000, transparent var(--edge), transparent calc(100% - var(--edge)), #000),
    linear-gradient(to bottom, #000, transparent var(--edge), transparent calc(100% - var(--edge)), #000);
  mask-composite: add;
  -webkit-mask-image:
    linear-gradient(to right, #000, transparent var(--edge), transparent calc(100% - var(--edge)), #000),
    linear-gradient(to bottom, #000, transparent var(--edge), transparent calc(100% - var(--edge)), #000);
  -webkit-mask-composite: source-over;
}

.board.is-dragging {
  cursor: grabbing;
}

.board-stage {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform-origin: center center;
}

.board.is-ready .board-stage {
  opacity: 1;
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
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
  transition:
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
  transform: scale(1);
  transition: transform 0.22s var(--ease);
}

.board.is-dragging .board-face,
.board.is-dragging .board-face img {
  transition: none;
}

.board-face.is-unfollowed {
  opacity: 0.42;
  filter: grayscale(1);
}

@media (hover: hover) and (pointer: fine) {
  .board:has(.board-face:hover) .board-face:not(:hover),
  .board:has(.board-face:focus-visible) .board-face:not(:focus-visible) {
    opacity: 0.28;
    filter: saturate(0.2);
  }

  .board-face:hover,
  .board-face:focus-visible {
    z-index: 3;
    overflow: visible;
    opacity: 1;
    filter: none;
  }

  .board-face:hover img,
  .board-face:focus-visible img {
    transform: scale(var(--hover-scale));
  }
}

.board.is-coarse .board-face.is-picked {
  z-index: 3;
  box-shadow: inset 0 0 0 2px var(--fg);
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
