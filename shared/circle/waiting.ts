import { hashString } from './layout.ts'

/** How many waiting sentences each locale keeps. The same id always lands on the same slot. */
export const WAITING_LINE_COUNT = 3

export function waitingLineIndex(userId: string): number {
  return hashString(userId) % WAITING_LINE_COUNT
}
