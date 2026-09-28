<script setup lang="ts">
import type { StarMapLayout } from '#shared/circle/layout'
import type { PeopleFile, PlacedPerson } from '#shared/circle/types'

const props = defineProps<{
  center: PeopleFile['center']
  layout: StarMapLayout
}>()

const emit = defineEmits<{
  select: [person: PlacedPerson]
}>()

const root = ref<HTMLElement>()
const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
const dragging = ref(false)
const lastPointer = ref({ x: 0, y: 0 })

const hovered = ref<PlacedPerson | null>(null)

const viewBoxStr = computed(() => {
  const { minX, minY, width, height } = props.layout.viewBox
  return `${minX} ${minY} ${width} ${height}`
})

function ringPath(radius: number): string {
  const wobble = (a: number) => radius + Math.sin(a * 5) * 2.2 + Math.cos(a * 3) * 1.4
  const steps = 96
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const r = wobble(a)
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return `${pts.join(' ')} Z`
}

function onWheel(event: WheelEvent): void {
  if (!root.value)
    return
  event.preventDefault()
  const delta = event.deltaY > 0 ? 0.92 : 1.08
  scale.value = Math.min(2.5, Math.max(0.55, scale.value * delta))
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0)
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

function selectNode(person: PlacedPerson): void {
  emit('select', person)
}

function onNodeKey(event: KeyboardEvent, person: PlacedPerson): void {
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
    ref="root"
    class="star-map"
    @wheel="onWheel"
  >
    <div
      class="star-map-stage"
      :style="{ transform: transformStyle }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <svg
        class="star-map-svg"
        :viewBox="viewBoxStr"
        role="img"
        aria-label="朋友圈星图"
      >
        <g class="star-map-rings">
          <path
            v-for="guide in layout.rings"
            :key="guide.ring"
            :d="ringPath(guide.radius)"
            class="star-map-ring"
            fill="none"
          />
        </g>

        <g class="star-map-center">
          <circle
            r="52"
            class="star-map-center-halo"
          />
          <image
            :href="center.avatar"
            :width="88"
            :height="88"
            x="-44"
            y="-44"
            class="star-map-center-avatar"
          />
          <text
            y="62"
            text-anchor="middle"
            class="star-map-center-label"
          >{{ center.name }}</text>
        </g>

        <g class="star-map-nodes">
          <g
            v-for="node in layout.nodes"
            :key="node.person.userId"
            :transform="`translate(${node.x} ${node.y})`"
            class="star-map-node"
            :class="{
              'is-unfollowed': node.person.status === 'unfollowed',
              'is-hovered': hovered?.userId === node.person.userId,
            }"
          >
            <foreignObject
              :x="-node.size / 2"
              :y="-node.size / 2"
              :width="node.size"
              :height="node.size"
            >
              <button
                type="button"
                class="star-map-avatar-btn"
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
        </g>
      </svg>

      <Transition name="fade">
        <div
          v-if="hovered"
          class="star-map-tooltip"
          role="status"
        >
          <span class="star-map-tooltip-name">{{ hovered.name }}</span>
          <span class="star-map-tooltip-handle">@{{ hovered.handle }}</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.star-map {
  position: relative;
  width: 100%;
  min-height: min(72vh, 640px);
  border: 1px solid var(--line);
  border-radius: 12px;
  background: color-mix(in srgb, var(--bg) 92%, var(--faint));
  overflow: hidden;
  touch-action: none;
  cursor: grab;
}

.star-map:active {
  cursor: grabbing;
}

.star-map-stage {
  width: 100%;
  height: 100%;
  min-height: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  position: relative;
}

.star-map-svg {
  width: min(100%, 720px);
  height: auto;
  display: block;
}

.star-map-ring {
  stroke: var(--line);
  stroke-width: 1.6;
  vector-effect: non-scaling-stroke;
  opacity: 0.9;
}

.star-map-center-halo {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.2;
  opacity: 0.35;
}

.star-map-center-avatar {
  clip-path: circle(50% at 50% 50%);
}

.star-map-center-label {
  font-family: var(--font-display);
  font-size: 14px;
  fill: var(--fg);
}

.star-map-avatar-btn {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 2px solid var(--line);
  border-radius: 50%;
  background: var(--bg);
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 0.2s var(--ease),
    transform 0.2s var(--ease),
    opacity 0.2s var(--ease);
}

.star-map-avatar-btn:hover,
.star-map-avatar-btn:focus-visible {
  border-color: var(--accent);
  transform: scale(1.06);
  outline: none;
}

.star-map-avatar-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.star-map-node.is-unfollowed .star-map-avatar-btn {
  opacity: 0.42;
  filter: grayscale(0.85);
}

.star-map-tooltip {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 14px;
  text-align: center;
  pointer-events: none;
  backdrop-filter: blur(6px);
}

.star-map-tooltip-name {
  display: block;
  font-family: var(--font-display);
  font-size: 1.05rem;
}

.star-map-tooltip-handle {
  color: var(--muted);
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

@media (max-width: 640px) {
  .star-map {
    min-height: 56vh;
  }
}
</style>
