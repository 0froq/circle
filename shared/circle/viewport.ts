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
export interface FaceFrame {
  x: number
  y: number
  size: number
}

/**
 * Pan and zoom so a face, including its image enlargement, lands on a screen
 * point at a fixed size. Coordinates are board pixels and screen pixels.
 * This view is a presentation frame, so it is not limited to pinch zoom.
 */
export function viewForFace(
  faceX: number,
  faceY: number,
  faceDiameter: number,
  imageScale: number,
  boardWidth: number,
  boardHeight: number,
  boardLeft: number,
  boardTop: number,
  targetX: number,
  targetY: number,
  targetSize: number,
): BoardView {
  const visual = faceDiameter * imageScale
  const zoom = visual > 0 && targetSize > 0 ? targetSize / visual : MIN_ZOOM
  const localX = faceX - boardWidth / 2
  const localY = faceY - boardHeight / 2
  return {
    zoom,
    x: targetX - boardLeft - boardWidth / 2 - localX * zoom,
    y: targetY - boardTop - boardHeight / 2 - localY * zoom,
  }
}

/** Where a face is drawn after the stage transform, including image enlargement. */
export function faceOnScreen(
  faceX: number,
  faceY: number,
  faceDiameter: number,
  imageScale: number,
  boardWidth: number,
  boardHeight: number,
  boardLeft: number,
  boardTop: number,
  view: BoardView,
): FaceFrame {
  const localX = faceX - boardWidth / 2
  const localY = faceY - boardHeight / 2
  return {
    x: boardLeft + boardWidth / 2 + view.x + localX * view.zoom,
    y: boardTop + boardHeight / 2 + view.y + localY * view.zoom,
    size: faceDiameter * imageScale * view.zoom,
  }
}

export function zoomToward(
  view: BoardView,
  originX: number,
  originY: number,
  nextOriginX: number,
  nextOriginY: number,
  nextZoom: number,
  size: number | { width: number, height: number },
): BoardView {
  const zoom = clampZoom(nextZoom)
  const safeZoom = view.zoom > 0 ? view.zoom : MIN_ZOOM
  const width = typeof size === 'number' ? size : size.width
  const height = typeof size === 'number' ? size : size.height
  const contentX = (originX - view.x) / safeZoom
  const contentY = (originY - view.y) / safeZoom
  return {
    zoom,
    x: clampPan(nextOriginX - contentX * zoom, width, zoom),
    y: clampPan(nextOriginY - contentY * zoom, height, zoom),
  }
}
