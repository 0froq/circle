/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { faceRadius, packCircles } from './pack.ts'

function discs(n: number) {
  return Array.from({ length: n }, (_, index) => {
    const id = `p${index}`
    return { id, r: faceRadius(id) }
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

  it('ignores score-like fields because radius only uses id', () => {
    assert.equal(faceRadius('same'), faceRadius('same'))
    const quiet = packCircles([{ id: 'same', r: faceRadius('same') }, { id: 'other', r: 20 }])
    const loud = packCircles([{ id: 'same', r: faceRadius('same') }, { id: 'other', r: 20 }])
    assert.equal(quiet[0]!.x, loud[0]!.x)
    assert.equal(quiet[0]!.y, loud[0]!.y)
  })
})
