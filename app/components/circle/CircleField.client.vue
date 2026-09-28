<script setup lang="ts">
import type { FieldBody, FieldPointer } from '#shared/circle/field'
import type { PeopleFile, Person } from '#shared/circle/types'
import * as THREE from 'three'
import { stepField } from '#shared/circle/field'
import { CENTER_MARK, hashString, layoutBoard } from '#shared/circle/layout'

const props = defineProps<{
  center: PeopleFile['center']
  people: Person[]
}>()

const emit = defineEmits<{
  select: [person: Person]
}>()

const { theme } = useTheme()

const label = ref<{ name: string, handle: string, x: number, y: number } | null>(null)
let releaseField = (): void => {}

onBeforeUnmount(() => {
  const stop = releaseField
  releaseField = () => {}
  stop()
})

function bindHost(node: unknown): void {
  if (!(node instanceof HTMLElement))
    return
  mountField(node)
}

interface NodeView {
  id: string
  person: Person | null
  body: FieldBody
  sprite: THREE.Sprite
  base: number
}

function mountField(el: HTMLElement): void {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, 1, 1, 4000)
  camera.position.set(30, -150, 720)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  el.appendChild(renderer.domElement)

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture(theme.value === 'dark' ? '#ff6242' : '#e8431f'),
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  }))
  glow.scale.set(340, 340, 1)
  glow.visible = false
  scene.add(glow)

  const nodes: NodeView[] = []
  const placed = layoutBoard(props.people)
  const centerBody = makeBody('center', CENTER_MARK.x, CENTER_MARK.y, 0)
  nodes.push({
    id: 'center',
    person: null,
    body: centerBody,
    sprite: faceSprite(props.center.avatar, false, props.center.name),
    base: 64,
  })
  for (const node of placed.nodes) {
    const person = node.person
    const z = ((hashString(person.userId) % 1000) / 1000 - 0.5) * 80
    const body = makeBody(person.userId, node.x, node.y, z)
    body.vx = ((hashString(`${person.userId}:vx`) % 100) / 100 - 0.5) * 1.2
    body.vy = ((hashString(`${person.userId}:vy`) % 100) / 100 - 0.5) * 1.2
    nodes.push({
      id: person.userId,
      person,
      body,
      sprite: faceSprite(person.avatar, person.status === 'unfollowed', person.name),
      base: 52,
    })
  }
  for (const node of nodes)
    scene.add(node.sprite)

  const pointer: FieldPointer = { x: 0, y: 0, z: 0, active: false }
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const hitPoint = new THREE.Vector3()
  const projected = new THREE.Vector3()

  let mode: 'none' | 'node' | 'pan' = 'none'
  let dragId: string | null = null
  let moved = false
  let lastX = 0
  let lastY = 0
  let focusId: string | null = null
  let alive = true
  let raf = 0
  let last = performance.now()

  function resize(): void {
    const width = el.clientWidth
    const height = el.clientHeight
    if (width === 0 || height === 0)
      return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  function setPointer(event: PointerEvent, active: boolean): void {
    const rect = renderer.domElement.getBoundingClientRect()
    ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(ndc, camera)
    if (raycaster.ray.intersectPlane(plane, hitPoint)) {
      pointer.x = hitPoint.x
      pointer.y = hitPoint.y
      pointer.z = hitPoint.z
    }
    pointer.active = active
  }

  function pick(): NodeView | null {
    const hits = raycaster.intersectObjects(nodes.map(node => node.sprite))
    const object = hits[0]?.object
    if (!object)
      return null
    return nodes.find(node => node.sprite === object) ?? null
  }

  function show(node: NodeView | null): void {
    if (!node) {
      label.value = null
      return
    }
    projected.copy(node.sprite.position).project(camera)
    const width = el.clientWidth
    const height = el.clientHeight
    label.value = {
      name: node.person?.name ?? props.center.name,
      handle: node.person?.handle ?? props.center.handle,
      x: (projected.x * 0.5 + 0.5) * width,
      y: (-projected.y * 0.5 + 0.5) * height,
    }
  }

  function peopleNodes(): NodeView[] {
    return nodes.filter(node => node.person)
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0)
      return
    setPointer(event, false)
    const node = pick()
    mode = node ? 'node' : 'pan'
    dragId = node?.id ?? null
    moved = false
    lastX = event.clientX
    lastY = event.clientY
    if (node)
      node.body.pinned = true
    renderer.domElement.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent): void {
    const dx = event.clientX - lastX
    const dy = event.clientY - lastY
    if (Math.hypot(dx, dy) > 4)
      moved = true
    lastX = event.clientX
    lastY = event.clientY

    if (mode === 'pan') {
      const height = el.clientHeight || 1
      const world = camera.position.z * Math.tan((camera.fov * Math.PI) / 360) * 2 / height
      camera.position.x -= dx * world
      camera.position.y += dy * world
      pointer.active = false
      return
    }

    setPointer(event, mode !== 'node')
    if (mode === 'node' && dragId) {
      const node = nodes.find(item => item.id === dragId)
      if (node) {
        node.body.x = pointer.x
        node.body.y = pointer.y
        node.body.pinned = true
      }
      glow.visible = false
      return
    }

    glow.visible = true
    glow.position.set(pointer.x, pointer.y, pointer.z)
    const node = pick()
    if (node)
      focusId = node.id
    show(node)
  }

  function onPointerUp(event: PointerEvent): void {
    const node = dragId ? nodes.find(item => item.id === dragId) : null
    if (node)
      node.body.pinned = false
    if (mode === 'node' && node?.person && !moved)
      emit('select', node.person)
    mode = 'none'
    dragId = null
    setPointer(event, true)
  }

  function onPointerLeave(): void {
    if (mode === 'none') {
      pointer.active = false
      glow.visible = false
      if (!focusId)
        label.value = null
    }
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault()
    const next = camera.position.z * (event.deltaY > 0 ? 1.08 : 0.92)
    camera.position.z = Math.min(1500, Math.max(280, next))
  }

  function onKey(event: KeyboardEvent): void {
    const list = peopleNodes()
    if (list.length === 0)
      return
    const index = Math.max(0, list.findIndex(node => node.id === focusId))
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      const next = list[(index + 1) % list.length]!
      focusId = next.id
      show(next)
    }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      const next = list[(index - 1 + list.length) % list.length]!
      focusId = next.id
      show(next)
    }
    else if (event.key === 'Enter' && focusId) {
      const node = list.find(item => item.id === focusId)
      if (node?.person)
        emit('select', node.person)
    }
  }

  function frame(now: number): void {
    if (!alive)
      return
    const dt = now - last
    last = now
    stepField(nodes.map(node => node.body), dt, pointer)
    let shown: NodeView | null = null
    for (const node of nodes) {
      node.sprite.position.set(node.body.x, node.body.y, node.body.z)
      const hot = node.id === focusId || node.id === dragId
      const scale = node.base * (hot ? 1.12 : 1)
      node.sprite.scale.set(scale, scale, 1)
      if (hot)
        shown = node
    }
    if (shown && mode !== 'pan')
      show(shown)
    renderer.render(scene, camera)
    raf = requestAnimationFrame(frame)
  }

  const observer = new ResizeObserver(() => resize())
  observer.observe(el)
  resize()
  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointerleave', onPointerLeave)
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('keydown', onKey)
  raf = requestAnimationFrame(frame)

  const stopTheme = watch(theme, (value) => {
    const material = glow.material as THREE.SpriteMaterial
    material.map?.dispose()
    material.map = radialTexture(value === 'dark' ? '#ff6242' : '#e8431f')
    material.needsUpdate = true
  })

  releaseField = () => {
    stopTheme()
    alive = false
    cancelAnimationFrame(raf)
    observer.disconnect()
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
    renderer.domElement.removeEventListener('wheel', onWheel)
    el.removeEventListener('keydown', onKey)
    for (const node of nodes) {
      const material = node.sprite.material as THREE.SpriteMaterial
      material.map?.dispose()
      material.dispose()
    }
    const glowMaterial = glow.material as THREE.SpriteMaterial
    glowMaterial.map?.dispose()
    glowMaterial.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
}

function makeBody(id: string, x: number, y: number, z: number): FieldBody {
  return {
    id,
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    homeX: x,
    homeY: y,
    homeZ: z,
    pinned: false,
    mass: 1,
  }
}

function faceSprite(url: string, muted: boolean, name: string): THREE.Sprite {
  const material = new THREE.SpriteMaterial({
    transparent: true,
    depthWrite: false,
    opacity: muted ? 0.42 : 1,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(52, 52, 1)
  sprite.name = name
  const image = new Image()
  image.onload = () => {
    material.map = circleTexture(image, muted)
    material.needsUpdate = true
  }
  image.src = url
  return sprite
}

function circleTexture(image: HTMLImageElement, muted: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return new THREE.CanvasTexture(canvas)
  ctx.beginPath()
  ctx.arc(64, 64, 62, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(image, 0, 0, 128, 128)
  if (muted) {
    const pixels = ctx.getImageData(0, 0, 128, 128)
    for (let i = 0; i < pixels.data.length; i += 4) {
      const tone = pixels.data[i]! * 0.3 + pixels.data[i + 1]! * 0.59 + pixels.data[i + 2]! * 0.11
      pixels.data[i] = tone
      pixels.data[i + 1] = tone
      pixels.data[i + 2] = tone
    }
    ctx.putImageData(pixels, 0, 0)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function radialTexture(color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return new THREE.CanvasTexture(canvas)
  const paint = ctx.createRadialGradient(128, 128, 12, 128, 128, 128)
  paint.addColorStop(0, color)
  paint.addColorStop(1, 'transparent')
  ctx.fillStyle = paint
  ctx.fillRect(0, 0, 256, 256)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
</script>

<template>
  <div
    :ref="bindHost"
    class="board field"
    tabindex="0"
    aria-label="力场画板。拖动一个人，其余的人会被推开。方向键切换，Enter 打开。"
  >
    <p
      v-if="label"
      class="field-label"
      :style="{ left: `${label.x}px`, top: `${label.y}px` }"
    >
      <span>{{ label.name }}</span>
      <span class="field-handle">@{{ label.handle }}</span>
    </p>
  </div>
</template>

<style scoped>
.field {
  position: relative;
  width: 100%;
  height: min(78vh, 820px);
  min-height: 480px;
  outline: none;
  cursor: grab;
  touch-action: none;
}

.field:active {
  cursor: grabbing;
}

.field :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.field-label {
  position: absolute;
  transform: translate(-50%, -130%);
  margin: 0;
  display: flex;
  gap: 0.55em;
  align-items: baseline;
  font-family: var(--font-display);
  font-size: 1.2rem;
  pointer-events: none;
  white-space: nowrap;
}

.field-handle {
  color: var(--muted);
  font-family: var(--font-text);
  font-size: 0.82rem;
}
</style>
