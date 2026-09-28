import type { DisplayRing, PlacedPerson } from './types.ts'

export interface MapNode {
  person: PlacedPerson
  x: number
  y: number
  size: number
  angleRad: number
}

export interface RingGuide {
  ring: DisplayRing
  radius: number
}

export interface StarMapLayout {
  nodes: MapNode[]
  rings: RingGuide[]
  viewBox: { minX: number, minY: number, width: number, height: number }
}

const RING_RADIUS: Record<DisplayRing, number> = {
  1: 118,
  2: 198,
  3: 278,
  4: 358,
}

const RING_SIZE: Record<DisplayRing, number> = {
  1: 56,
  2: 46,
  3: 38,
  4: 32,
}

function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function jitterAngle(userId: string, index: number): number {
  const h = hashString(`${userId}:${index}`)
  return ((h % 1000) / 1000 - 0.5) * 0.14
}

/** Deterministic polar layout: same data ⇒ same positions. */
export function layoutStarMap(people: PlacedPerson[]): StarMapLayout {
  const byRing = new Map<DisplayRing, PlacedPerson[]>()
  for (const ring of [1, 2, 3, 4] as const)
    byRing.set(ring, [])
  for (const person of people)
    byRing.get(person.layoutRing)!.push(person)

  for (const list of byRing.values())
    list.sort((a, b) => a.userId.localeCompare(b.userId))

  const nodes: MapNode[] = []
  const rings: RingGuide[] = []

  for (const ring of [1, 2, 3, 4] as const) {
    const group = byRing.get(ring)!
    if (group.length === 0)
      continue
    rings.push({ ring, radius: RING_RADIUS[ring] })
    const n = group.length
    group.forEach((person, index) => {
      const base = (index / n) * Math.PI * 2 - Math.PI / 2
      const angleRad = base + jitterAngle(person.userId, index)
      const radius = RING_RADIUS[ring]
      nodes.push({
        person,
        x: Math.cos(angleRad) * radius,
        y: Math.sin(angleRad) * radius,
        size: RING_SIZE[ring],
        angleRad,
      })
    })
  }

  const pad = 72
  const maxR = Math.max(...rings.map(r => r.radius), 0) + 48
  const viewBox = {
    minX: -maxR - pad,
    minY: -maxR - pad,
    width: (maxR + pad) * 2,
    height: (maxR + pad) * 2,
  }

  return { nodes, rings, viewBox }
}
