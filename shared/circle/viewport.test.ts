/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clampPan, clampZoom, MAX_ZOOM, MIN_ZOOM, zoomToward } from './viewport.ts'

describe('board zoom', () => {
  it('keeps zoom inside the fixed limits', () => {
    assert.equal(clampZoom(0.2), MIN_ZOOM)
    assert.equal(clampZoom(8), MAX_ZOOM)
    assert.equal(clampZoom(Number.NaN), MIN_ZOOM)
    assert.equal(clampZoom(2), 2)
  })

  it('holds the circle still until it is zoomed in', () => {
    assert.equal(clampPan(40, 400, MIN_ZOOM), 0)
    assert.equal(clampPan(300, 400, 2), 200)
    assert.equal(clampPan(-300, 400, 2), -200)
  })

  it('zooms toward the pointer without sliding that point', () => {
    const size = 400
    const originX = 80
    const originY = -40
    const next = zoomToward({ zoom: 1, x: 0, y: 0 }, originX, originY, originX, originY, 2, size)
    assert.equal(next.zoom, 2)
    assert.equal(next.x + originX * next.zoom, originX)
    assert.equal(next.y + originY * next.zoom, originY)
  })

  it('does not zoom past the maximum', () => {
    const next = zoomToward({ zoom: MAX_ZOOM, x: 0, y: 0 }, 10, 10, 10, 10, MAX_ZOOM + 2, 400)
    assert.equal(next.zoom, MAX_ZOOM)
  })
})
