/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clampPan, clampZoom, faceOnScreen, MAX_ZOOM, MIN_ZOOM, viewForFace, zoomToward } from './viewport.ts'

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

  it('frames an enlarged face on the card avatar', () => {
    const boardWidth = 800
    const boardHeight = 500
    const boardLeft = 40
    const boardTop = 80
    const faceX = 300
    const faceY = 180
    const faceDiameter = 40
    const imageScale = 2.4
    const targetX = 510
    const targetY = 260
    const targetSize = 72
    const view = viewForFace(
      faceX,
      faceY,
      faceDiameter,
      imageScale,
      boardWidth,
      boardHeight,
      boardLeft,
      boardTop,
      targetX,
      targetY,
      targetSize,
    )
    const screen = faceOnScreen(
      faceX,
      faceY,
      faceDiameter,
      imageScale,
      boardWidth,
      boardHeight,
      boardLeft,
      boardTop,
      view,
    )
    assert.ok(Math.abs(screen.x - targetX) < 1e-6)
    assert.ok(Math.abs(screen.y - targetY) < 1e-6)
    assert.ok(Math.abs(screen.size - targetSize) < 1e-6)
  })
})
