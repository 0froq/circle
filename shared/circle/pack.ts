export interface PackDisc {
  id: string
  r: number
}

export interface PackedDisc extends PackDisc {
  x: number
  y: number
}

const GAP = 1.25

const MIN_RADIUS = 14
const MAX_RADIUS = 62

/**
 * Face size from interaction count. Zero stays small. The busiest face in this
 * set is the largest. Log scale, so one very active person does not cover the circle.
 */
export function faceRadius(interactions: number, peak: number): number {
  if (interactions <= 0 || peak <= 0)
    return MIN_RADIUS
  const t = Math.log1p(interactions) / Math.log1p(peak)
  return MIN_RADIUS + Math.min(1, t) * (MAX_RADIUS - MIN_RADIUS)
}

/**
 * Pack discs into one tight round cluster, largest near the middle.
 * Each disc sticks to the free spot closest to the origin. Still coordinates, no animation.
 */
export function packCircles(discs: PackDisc[]): PackedDisc[] {
  const ordered = [...discs].sort((a, b) => b.r - a.r || a.id.localeCompare(b.id))
  const placed: PackedDisc[] = []

  for (const disc of ordered) {
    if (placed.length === 0) {
      placed.push({ ...disc, x: 0, y: 0 })
      continue
    }
    const spot = closestFreeSpot(placed, disc.r)
    placed.push({ ...disc, x: spot.x, y: spot.y })
  }
  return placed
}

function closestFreeSpot(placed: PackedDisc[], radius: number): { x: number, y: number } {
  let bestX = 0
  let bestY = 0
  let bestD = Infinity

  const consider = (x: number, y: number): void => {
    if (hits(placed, x, y, radius))
      return
    const dist = Math.hypot(x, y)
    if (dist < bestD) {
      bestD = dist
      bestX = x
      bestY = y
    }
  }

  for (let i = 0; i < placed.length; i++) {
    const a = placed[i]!
    const orbit = a.r + radius + GAP
    for (let step = 0; step < 28; step++) {
      const angle = (step / 28) * Math.PI * 2
      consider(a.x + Math.cos(angle) * orbit, a.y + Math.sin(angle) * orbit)
    }
    for (let j = i + 1; j < placed.length; j++) {
      for (const point of touchPair(a, placed[j]!, radius))
        consider(point.x, point.y)
    }
  }

  if (!Number.isFinite(bestD))
    return { x: radius * 3, y: 0 }
  return { x: bestX, y: bestY }
}

function hits(placed: PackedDisc[], x: number, y: number, radius: number): boolean {
  for (const disc of placed) {
    const min = disc.r + radius + GAP - 0.05
    if (Math.hypot(disc.x - x, disc.y - y) < min)
      return true
  }
  return false
}

function touchPair(a: PackedDisc, b: PackedDisc, radius: number): { x: number, y: number }[] {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.hypot(dx, dy)
  const reachA = a.r + radius + GAP
  const reachB = b.r + radius + GAP
  if (dist < 0.01 || dist > reachA + reachB || dist < Math.abs(reachA - reachB))
    return []
  const along = (reachA * reachA - reachB * reachB + dist * dist) / (2 * dist)
  const heightSq = reachA * reachA - along * along
  if (heightSq < 0)
    return []
  const height = Math.sqrt(heightSq)
  const midX = a.x + (along * dx) / dist
  const midY = a.y + (along * dy) / dist
  const offX = (-dy * height) / dist
  const offY = (dx * height) / dist
  return [
    { x: midX + offX, y: midY + offY },
    { x: midX - offX, y: midY - offY },
  ]
}

export function packBounds(packed: PackedDisc[]): { minX: number, minY: number, width: number, height: number } {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const disc of packed) {
    minX = Math.min(minX, disc.x - disc.r)
    minY = Math.min(minY, disc.y - disc.r)
    maxX = Math.max(maxX, disc.x + disc.r)
    maxY = Math.max(maxY, disc.y + disc.r)
  }
  const pad = 10
  if (!Number.isFinite(minX))
    return { minX: -1, minY: -1, width: 2, height: 2 }
  const side = Math.max(maxX - minX, maxY - minY) + pad * 2
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  return {
    minX: cx - side / 2,
    minY: cy - side / 2,
    width: side,
    height: side,
  }
}
