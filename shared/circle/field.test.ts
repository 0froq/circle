/* eslint-disable test/no-import-node-test */
import type { FieldBody } from './field.ts'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { stepField } from './field.ts'

function body(id: string, x: number, y = 0, z = 0): FieldBody {
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

describe('force field', () => {
  it('pushes overlapping charges apart', () => {
    const bodies = [body('a', 0), body('b', 8)]
    for (let i = 0; i < 8; i++)
      stepField(bodies, 16, null)
    assert.ok(Math.abs(bodies[0]!.x - bodies[1]!.x) > 8)
  })

  it('returns a body toward its own home', () => {
    const one = body('a', 80)
    one.homeX = 10
    stepField([one], 16, null)
    assert.ok(one.x < 80)
  })

  it('does not move a pinned body', () => {
    const pinned = body('a', 0)
    pinned.pinned = true
    const other = body('b', 30)
    stepField([pinned, other], 16, null)
    assert.equal(pinned.x, 0)
    assert.equal(pinned.vx, 0)
  })

  it('cursor shoves nearby bodies outward', () => {
    const near = body('a', 40, 0, 0)
    stepField([near], 16, { x: 0, y: 0, z: 0, active: true })
    assert.ok(near.x > 40)
  })
})
