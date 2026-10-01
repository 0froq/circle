<script setup lang="ts">
import type { Person } from '#shared/circle/types'
import type { BoardView } from '#shared/circle/viewport'
import { faceRadius, packBounds, packCircles } from '#shared/circle/pack'
import { clampPan, faceOnScreen, MIN_ZOOM, viewForFace, zoomToward } from '#shared/circle/viewport'

const props = defineProps<{
  people: Person[]
  activeId?: string | null
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
const FOCUS_MS = 900

const board = ref<HTMLElement>()
const stage = ref<HTMLElement>()
const boardWidth = ref(0)
const boardHeight = ref(0)
const facesReady = ref(false)
const hovered = ref<{ name: string, handle: string } | null>(null)
const coarse = ref(false)
const pickedId = ref<string | null>(null)
const dragging = ref(false)
const view = ref<BoardView>({ zoom: MIN_ZOOM, x: 0, y: 0 })
const settling = ref(false)
const tracking = ref(false)
const focusMoving = ref(false)
const focusFrame = ref<{ x: number, y: number, size: number } | null>(null)
const focusedId = ref<string | null>(null)
const heldScale = ref(1)

let restView: BoardView | null = null
let alignGeneration = 0
let settleTimer = 0
let framing = false

let boardObserver: ResizeObserver | undefined
let coarseMedia: MediaQueryList | undefined
const pointers = new Map<number, { x: number, y: number }>()
let drag: { id: number, x: number, y: number, panX: number, panY: number, moved: boolean } | null = null
let pinch: { zoom: number, x: number, y: number, dist: number, originX: number, originY: number } | null = null
let ignoreClick = false

const stageStyle = computed(() => ({
  transform: `translate(${view.value.x}px, ${view.value.y}px) scale(${view.value.zoom})`,
}))

onMounted(() => {
  if (board.value) {
    boardObserver = new ResizeObserver(([entry]) => {
      boardWidth.value = entry?.contentRect.width ?? 0
      boardHeight.value = entry?.contentRect.height ?? 0
      if (props.activeId) {
        alignGeneration += 1
        void alignToCard(props.activeId, alignGeneration)
        return
      }
      view.value = fit(view.value)
    })
    boardObserver.observe(board.value)
    board.value.addEventListener('wheel', onWheel, { passive: false })
    board.value.addEventListener('touchmove', onTouchMove, { passive: false })
  }
  coarseMedia = window.matchMedia('(pointer: coarse)')
  syncStored()
  coarseMedia.addEventListener('change', syncStored)
  window.addEventListener('scroll', onScroll, { passive: true })
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
  window.removeEventListener('scroll', onScroll)
  window.clearTimeout(settleTimer)
})

watch(() => props.activeId, (id) => {
  window.clearTimeout(settleTimer)
  alignGeneration += 1
  const generation = alignGeneration
  if (!id) {
    releaseFocus(generation)
    return
  }
  if (!restView)
    restView = { ...view.value }
  void alignToCard(id, generation)
})

function syncStored(): void {
  coarse.value = coarseMedia?.matches ?? false
}

function frame(): { width: number, height: number } {
  return {
    width: board.value?.clientWidth ?? boardWidth.value,
    height: board.value?.clientHeight ?? boardHeight.value,
  }
}

function fit(next: BoardView): BoardView {
  const { width, height } = frame()
  return {
    zoom: next.zoom,
    x: clampPan(next.x, width, next.zoom),
    y: clampPan(next.y, height, next.zoom),
  }
}

function place(face: Face): Record<string, string> {
  const box = packed.value.bounds
  const boardW = boardWidth.value
  const boardH = boardHeight.value || boardW
  if (boardW <= 0 || boardH <= 0 || box.width <= 0 || box.height <= 0) {
    return {
      'left': '50%',
      'top': '50%',
      'width': `${face.d}px`,
      '--hover-scale': '1',
    }
  }
  const scale = Math.min(boardW / box.width, boardH / box.height)
  const d = face.d * scale
  const cx = (boardW - box.width * scale) / 2 + (face.x - box.minX) * scale
  const cy = (boardH - box.height * scale) / 2 + (face.y - box.minY) * scale
  const held = focusedId.value === face.id
  const hover = held ? heldScale.value : Math.max(1, HOVER_MIN / (d * view.value.zoom))
  return {
    'left': `${cx}px`,
    'top': `${cy}px`,
    'width': `${d}px`,
    '--hover-scale': String(hover),
  }
}

function layoutOf(face: Face): { cx: number, cy: number, d: number } | null {
  const box = packed.value.bounds
  const boardW = boardWidth.value
  const boardH = boardHeight.value || boardW
  if (boardW <= 0 || boardH <= 0 || box.width <= 0 || box.height <= 0)
    return null
  const scale = Math.min(boardW / box.width, boardH / box.height)
  return {
    d: face.d * scale,
    cx: (boardW - box.width * scale) / 2 + (face.x - box.minX) * scale,
    cy: (boardH - box.height * scale) / 2 + (face.y - box.minY) * scale,
  }
}

function imageScale(diameter: number, zoom: number): number {
  const rendered = diameter * zoom
  if (rendered <= 0)
    return 1
  return Math.max(1, HOVER_MIN / rendered)
}

function waitFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}

function cardAvatarFrame(avatar: HTMLElement): { x: number, y: number, size: number } {
  const rect = avatar.getBoundingClientRect()
  const card = avatar.closest('.circle-card')
  let shiftY = 0
  if (card) {
    const transform = getComputedStyle(card).transform
    if (transform && transform !== 'none')
      shiftY = new DOMMatrix(transform).m42
  }
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2 - shiftY,
    size: rect.width,
  }
}

async function alignToCard(id: string, generation: number, attempt = 0): Promise<void> {
  await nextTick()
  await waitFrame()
  if (generation !== alignGeneration || props.activeId !== id)
    return
  const face = packed.value.faces.find(item => item.id === id)
  const node = board.value
  const avatar = document.querySelector<HTMLElement>('.circle-card-avatar')
  const layout = face ? layoutOf(face) : null
  const rest = restView
  if (!face || !node || !layout || !avatar || !rest || layout.d <= 0) {
    if (attempt < 8)
      void alignToCard(id, generation, attempt + 1)
    return
  }
  const rect = node.getBoundingClientRect()
  const scale = coarse.value ? 1 : imageScale(layout.d, rest.zoom)
  const boardW = boardWidth.value
  const boardH = boardHeight.value || boardW
  heldScale.value = scale
  const already = focusFrame.value !== null && focusedId.value === id
  focusedId.value = id
  const target = cardAvatarFrame(avatar)
  const next = viewForFace(
    layout.cx,
    layout.cy,
    layout.d,
    scale,
    boardW,
    boardH,
    rect.left,
    rect.top,
    target.x,
    target.y,
    target.size,
  )
  if (!already) {
    framing = true
    focusMoving.value = false
    focusFrame.value = faceOnScreen(
      layout.cx,
      layout.cy,
      layout.d,
      scale,
      boardW,
      boardH,
      rect.left,
      rect.top,
      rest,
    )
    await nextTick()
    await waitFrame()
    if (generation !== alignGeneration || props.activeId !== id) {
      framing = false
      return
    }
    focusMoving.value = true
    await nextTick()
    document.querySelector('.board-focus')?.getBoundingClientRect()
    if (generation !== alignGeneration || props.activeId !== id) {
      framing = false
      return
    }
  }
  framing = false
  tracking.value = already
  settling.value = true
  focusMoving.value = true
  view.value = next
  focusFrame.value = target
}

function onScroll(): void {
  if (framing || !props.activeId || !focusFrame.value)
    return
  alignGeneration += 1
  void alignToCard(props.activeId, alignGeneration)
}

function releaseFocus(generation: number): void {
  framing = false
  tracking.value = false
  const id = focusedId.value
  const rest = restView
  const face = id ? packed.value.faces.find(item => item.id === id) : undefined
  const node = board.value
  const layout = face ? layoutOf(face) : null
  if (!rest || !face || !node || !layout || !focusFrame.value) {
    focusFrame.value = null
    focusMoving.value = false
    settling.value = false
    focusedId.value = null
    restView = null
    view.value = rest ? { ...rest } : { zoom: MIN_ZOOM, x: 0, y: 0 }
    return
  }
  const rect = node.getBoundingClientRect()
  const boardW = boardWidth.value
  const boardH = boardHeight.value || boardW
  settling.value = true
  focusMoving.value = true
  view.value = { ...rest }
  focusFrame.value = faceOnScreen(
    layout.cx,
    layout.cy,
    layout.d,
    heldScale.value,
    boardW,
    boardH,
    rect.left,
    rect.top,
    rest,
  )
  settleTimer = window.setTimeout(() => {
    if (generation !== alignGeneration)
      return
    focusFrame.value = null
    focusMoving.value = false
    requestAnimationFrame(() => {
      if (generation !== alignGeneration)
        return
      settling.value = false
      focusedId.value = null
      restView = null
    })
  }, FOCUS_MS)
}

const focusFace = computed(() => packed.value.faces.find(face => face.id === focusedId.value) ?? null)

const focusStyle = computed(() => {
  const frame = focusFrame.value
  if (!frame)
    return {}
  return {
    left: `${frame.x - frame.size / 2}px`,
    top: `${frame.y - frame.size / 2}px`,
    width: `${frame.size}px`,
    height: `${frame.size}px`,
  }
})

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
  if (event.button !== 0 || props.activeId)
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
  if (coarse.value)
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
    view.value = zoomToward(
      pinch,
      pinch.originX,
      pinch.originY,
      geometry.originX,
      geometry.originY,
      pinch.zoom * (geometry.dist / pinch.dist),
      frame(),
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
  const { width, height } = frame()
  view.value = {
    zoom: view.value.zoom,
    x: clampPan(drag.panX + dx, width, view.value.zoom),
    y: clampPan(drag.panY + dy, height, view.value.zoom),
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
  // A normal scroll moves the page. Pinch on a trackpad arrives as a wheel event with ctrlKey.
  if (!event.ctrlKey || props.activeId)
    return
  event.preventDefault()
  const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY
  const factor = Math.exp(-delta * 0.0016)
  const origin = centerOf(event.clientX, event.clientY)
  if (!origin)
    return
  view.value = zoomToward(view.value, origin.x, origin.y, origin.x, origin.y, view.value.zoom * factor, frame())
}

function onTouchMove(event: TouchEvent): void {
  if (event.touches.length >= 2)
    event.preventDefault()
}
</script>

<template>
  <div class="sponsor">
    <div
      ref="board"
      class="board"
      :class="{ 'is-ready': facesReady, 'is-dragging': dragging, 'is-coarse': coarse, 'is-open': activeId, 'is-settling': settling, 'is-tracking': tracking }"
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
            :class="{ 'is-unfollowed': face.unfollowed, 'is-picked': coarse && pickedId === face.id, 'is-active': activeId === face.id, 'is-held': focusedId === face.id, 'is-lifted': focusFrame && focusedId === face.id }"
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
  <Teleport to="body">
    <div
      v-if="focusFace && focusFrame"
      class="board-focus"
      :class="{ 'is-moving': focusMoving, 'is-tracking': tracking }"
      :style="focusStyle"
      aria-hidden="true"
    >
      <img
        :src="focusFace.avatar"
        alt=""
        draggable="false"
        referrerpolicy="no-referrer"
      >
    </div>
  </Teleport>
</template>

<style scoped>
.sponsor {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: min(78%, 960px);
  min-height: 0;
  margin-inline: auto;
  container-type: inline-size;
}

.board {
  --edge-x: clamp(28px, 5%, 48px);
  --edge-y: clamp(40px, 8%, 72px);
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
  mask-image:
    linear-gradient(to right, transparent, #000 var(--edge-x), #000 calc(100% - var(--edge-x)), transparent),
    linear-gradient(to bottom, transparent, #000 var(--edge-y), #000 calc(100% - var(--edge-y)), transparent);
  mask-composite: intersect;
  -webkit-mask-image:
    linear-gradient(to right, transparent, #000 var(--edge-x), #000 calc(100% - var(--edge-x)), transparent),
    linear-gradient(to bottom, transparent, #000 var(--edge-y), #000 calc(100% - var(--edge-y)), transparent);
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
    linear-gradient(to right, #000, transparent var(--edge-x), transparent calc(100% - var(--edge-x)), #000),
    linear-gradient(to bottom, #000, transparent var(--edge-y), transparent calc(100% - var(--edge-y)), #000);
  mask-composite: add;
  -webkit-mask-image:
    linear-gradient(to right, #000, transparent var(--edge-x), transparent calc(100% - var(--edge-x)), #000),
    linear-gradient(to bottom, #000, transparent var(--edge-y), transparent calc(100% - var(--edge-y)), #000);
  -webkit-mask-composite: source-over;
}

.board.is-dragging {
  cursor: grabbing;
}

.board.is-open .board-stage,
.board.is-settling .board-stage {
  transition: transform 0.9s var(--ease);
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

.board.is-open .board-face:not(.is-active) {
  opacity: 0.28;
  filter: saturate(0.2);
}

.board.is-open .board-face.is-active,
.board-face.is-held {
  z-index: 3;
  overflow: visible;
  opacity: 1;
  filter: none;
}

.board-face.is-held img {
  transform: scale(var(--hover-scale));
}

.board-face.is-lifted {
  visibility: hidden;
}

.board-focus {
  position: fixed;
  z-index: 45;
  border-radius: 50%;
  overflow: hidden;
  pointer-events: none;
}

.board-focus.is-moving {
  transition:
    left 0.9s var(--ease),
    top 0.9s var(--ease),
    width 0.9s var(--ease),
    height 0.9s var(--ease);
}

.board.is-tracking .board-stage,
.board-focus.is-tracking {
  transition: none;
}

.board-focus img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 50%;
}

@media (prefers-reduced-motion: reduce) {
  .board.is-open .board-stage,
  .board.is-settling .board-stage,
  .board-focus.is-moving {
    transition: none;
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
