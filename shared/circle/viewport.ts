export const MIN_ZOOM = 1
export const MAX_ZOOM = 3

export interface BoardView {
  zoom: number
  x: number
  y: number
}

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom))
    return MIN_ZOOM
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

/** Pan is zero at the minimum zoom, and cannot pull the circle off the board. */
export function clampPan(pan: number, size: number, zoom: number): number {
  if (!Number.isFinite(pan) || !Number.isFinite(size) || size <= 0)
    return 0
  const limit = (size / 2) * Math.max(0, clampZoom(zoom) - 1)
  return Math.min(limit, Math.max(-limit, pan))
}

/**
 * Zoom toward a point. `origin` is where the gesture started, `nextOrigin` is
 * where that point should sit afterwards (the same point for a wheel zoom).
 * Both are offsets from the board center.
 */
export function zoomToward(
  view: BoardView,
  originX: number,
  originY: number,
  nextOriginX: number,
  nextOriginY: number,
  nextZoom: number,
  size: number,
): BoardView {
  const zoom = clampZoom(nextZoom)
  const safeZoom = view.zoom > 0 ? view.zoom : MIN_ZOOM
  const contentX = (originX - view.x) / safeZoom
  const contentY = (originY - view.y) / safeZoom
  return {
    zoom,
    x: clampPan(nextOriginX - contentX * zoom, size, zoom),
    y: clampPan(nextOriginY - contentY * zoom, size, zoom),
  }
}
