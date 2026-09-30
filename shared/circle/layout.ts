import type { Person } from './types.ts'

export interface BoardNode {
  person: Person
  x: number
  y: number
  size: number
}

export interface BoardLayout {
  nodes: BoardNode[]
  viewBox: { minX: number, minY: number, width: number, height: number }
}

/** Same face size for everyone. Position never encodes worth. */
export const AVATAR_SIZE = 46

export function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** The board is mutuals only. Hidden rows stay out. */
export function visiblePeople(people: Person[]): Person[] {
  return people.filter(p => !p.hidden && p.status === 'mutual')
}

const SHEET_W = 980
const SHEET_H = 640
/** froQ sits on the sheet, not at the hub of a set of orbits. */
export const CENTER_MARK = { x: -70, y: -36 }

/**
 * Drop faces on a rectangle of paper. Coordinates come only from `userId`
 * (no angle, no radius), so nothing reads as a nearer or farther ring.
 */
export function layoutBoard(people: Person[]): BoardLayout {
  const visible = [...people].sort((a, b) => a.userId.localeCompare(b.userId))
  const nodes: BoardNode[] = []
  const minGap = AVATAR_SIZE + 18

  for (const person of visible) {
    let x = 0
    let y = 0
    for (let attempt = 0; attempt < 200; attempt++) {
      const h = hashString(`${person.userId}:${attempt}`)
      const nextX = ((h % 100000) / 100000 - 0.5) * SHEET_W
      const nextY = (((h >>> 16) % 100000) / 100000 - 0.5) * SHEET_H
      const clearMark = Math.hypot(nextX - CENTER_MARK.x, nextY - CENTER_MARK.y) >= 78
      const clearOthers = nodes.every(node => Math.hypot(node.x - nextX, node.y - nextY) >= minGap)
      x = nextX
      y = nextY
      if (clearMark && clearOthers)
        break
    }
    nodes.push({ person, x, y, size: AVATAR_SIZE })
  }

  const pad = 48
  return {
    nodes,
    viewBox: {
      minX: -SHEET_W / 2 - pad,
      minY: -SHEET_H / 2 - pad,
      width: SHEET_W + pad * 2,
      height: SHEET_H + pad * 2,
    },
  }
}
