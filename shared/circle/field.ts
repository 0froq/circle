export interface FieldBody {
  id: string
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  homeX: number
  homeY: number
  homeZ: number
  pinned: boolean
  mass: number
}

export interface FieldPointer {
  x: number
  y: number
  z: number
  active: boolean
}

const REPULSE = 5200
const SOFT = 42
const HOME = 0.16
const DAMP = 0.84
const POINTER_RADIUS = 210
const POINTER_STRENGTH = 140
const Z_SPRING = 0.035
const MAX_SPEED = 16

function add(buf: Float64Array, index: number, value: number): void {
  buf[index] = (buf[index] ?? 0) + value
}

/**
 * One step of an equal-charge field. Repulsion is the same for every body.
 * Each body springs back to its own home on the sheet, not to a shared ring.
 */
export function stepField(bodies: FieldBody[], dtMs: number, pointer: FieldPointer | null): void {
  const scale = Math.min(Math.max(dtMs, 0), 32) / 16
  const n = bodies.length
  const ax = new Float64Array(n)
  const ay = new Float64Array(n)
  const az = new Float64Array(n)

  for (let i = 0; i < n; i++) {
    const a = bodies[i]!
    for (let j = i + 1; j < n; j++) {
      const b = bodies[j]!
      let dx = a.x - b.x
      let dy = a.y - b.y
      let dz = a.z - b.z
      let dist2 = dx * dx + dy * dy + dz * dz
      if (dist2 < 1) {
        dx = 1
        dy = 0
        dz = 0
        dist2 = 1
      }
      const dist = Math.sqrt(dist2)
      const force = REPULSE / (dist2 + SOFT)
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      const fz = (dz / dist) * force
      add(ax, i, fx)
      add(ay, i, fy)
      add(az, i, fz)
      add(ax, j, -fx)
      add(ay, j, -fy)
      add(az, j, -fz)
    }
  }

  for (let i = 0; i < n; i++) {
    const body = bodies[i]!
    add(ax, i, (body.homeX - body.x) * HOME)
    add(ay, i, (body.homeY - body.y) * HOME)
    add(az, i, (body.homeZ - body.z) * Z_SPRING)
    if (!pointer?.active)
      continue
    const dx = body.x - pointer.x
    const dy = body.y - pointer.y
    const dz = body.z - pointer.z
    const dist2 = dx * dx + dy * dy + dz * dz
    if (dist2 >= POINTER_RADIUS * POINTER_RADIUS || dist2 < 0.01)
      continue
    const dist = Math.sqrt(dist2)
    const falloff = 1 - dist / POINTER_RADIUS
    const force = POINTER_STRENGTH * falloff
    add(ax, i, (dx / dist) * force)
    add(ay, i, (dy / dist) * force)
    add(az, i, (dz / dist) * force * 0.4)
  }

  for (let i = 0; i < n; i++) {
    const body = bodies[i]!
    if (body.pinned) {
      body.vx = 0
      body.vy = 0
      body.vz = 0
      continue
    }
    const inv = scale / body.mass
    body.vx = (body.vx + ax[i]! * inv) * DAMP
    body.vy = (body.vy + ay[i]! * inv) * DAMP
    body.vz = (body.vz + az[i]! * inv) * DAMP
    const speed = Math.hypot(body.vx, body.vy, body.vz)
    if (speed > MAX_SPEED) {
      const limit = MAX_SPEED / speed
      body.vx *= limit
      body.vy *= limit
      body.vz *= limit
    }
    body.x += body.vx * scale
    body.y += body.vy * scale
    body.z += body.vz * scale
  }
}
