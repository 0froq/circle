/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { faceRadius, packCircles } from './pack.ts'

function discs(n: number) {
  return Array.from({ length: n }, (_, index) => {
    const interactions = index === 0 ? 46 : index < 6 ? index : 0
    return { id: `p${index}`, r: faceRadius(interactions, 46) }
  })
}

describe('sponsor circle pack', () => {
  it('does not overlap discs', () => {
    const packed = packCircles(discs(38))
    for (let i = 0; i < packed.length; i++) {
      for (let j = i + 1; j < packed.length; j++) {
        const a = packed[i]!
        const b = packed[j]!
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        assert.ok(dist + 0.6 >= a.r + b.r, `${a.id} overlaps ${b.id}`)
      }
    }
  })

  it('forms one round cluster', () => {
    const packed = packCircles(discs(38))
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
    const width = maxX - minX
    const height = maxY - minY
    assert.ok(Math.abs(width - height) / Math.max(width, height) < 0.18)
  })

  it('grows with interactions and keeps zero at the minimum', () => {
    const peak = 46
    assert.equal(faceRadius(0, peak), faceRadius(0, 0))
    assert.ok(faceRadius(1, peak) > faceRadius(0, peak))
    assert.ok(faceRadius(7, peak) > faceRadius(1, peak))
    assert.ok(faceRadius(peak, peak) > faceRadius(7, peak))
    assert.equal(faceRadius(peak, peak), faceRadius(999, peak))
  })
})
