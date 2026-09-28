import type { DisplayRing, Person, PlacedPerson, RingInput } from './types.ts'
import { UNFOLLOWED_MOVE_TO_RING_4 } from './constants.ts'

function isManualRing(ring: RingInput): ring is DisplayRing {
  return ring !== 'auto'
}

function parseDay(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`)
}

/** Higher = better (earlier firstSeen or more interactions). */
function percentileHigherIsBetter(values: number[], value: number): number {
  if (values.length === 0)
    return 0
  if (values.length === 1)
    return 1
  const sorted = [...values].sort((a, b) => a - b)
  let below = 0
  for (const v of sorted) {
    if (v < value)
      below++
  }
  return below / (sorted.length - 1)
}

function scoreToRing(score: number): 1 | 2 | 3 {
  if (score >= 2 / 3)
    return 1
  if (score >= 1 / 3)
    return 2
  return 3
}

function autoRingMap(visible: Person[]): Map<string, 1 | 2 | 3> {
  const map = new Map<string, 1 | 2 | 3>()
  if (visible.length === 0)
    return map

  const firstSeenMs = visible.map(p => parseDay(p.firstSeen))
  const interactions = visible.map(p => p.interactions)
  const earliest = Math.min(...firstSeenMs)
  const latest = Math.max(...firstSeenMs)

  const earlinessValues = visible.map((p) => {
    const t = parseDay(p.firstSeen)
    if (latest === earliest)
      return 1
    return 1 - (t - earliest) / (latest - earliest)
  })

  visible.forEach((person, i) => {
    const earliness = earlinessValues[i] ?? 0
    const earlinessPct = percentileHigherIsBetter(earlinessValues, earliness)
    const interactionPct = percentileHigherIsBetter(interactions, person.interactions)
    const score = 0.5 * earlinessPct + 0.5 * interactionPct
    map.set(person.userId, scoreToRing(score))
  })

  return map
}

export function visiblePeople(people: Person[]): Person[] {
  return people.filter(p => !p.hidden)
}

export function resolveRing(person: Person, autoMap: Map<string, 1 | 2 | 3>): DisplayRing {
  if (isManualRing(person.ring))
    return person.ring
  return autoMap.get(person.userId) ?? 3
}

export function layoutRingFor(person: Person, resolvedRing: DisplayRing): DisplayRing {
  if (person.status === 'unfollowed' && UNFOLLOWED_MOVE_TO_RING_4)
    return 4
  return resolvedRing
}

/** Assign rings for everyone who is not hidden. */
export function placePeople(people: Person[]): PlacedPerson[] {
  const visible = visiblePeople(people)
  const autoTargets = visible.filter(p => p.ring === 'auto')
  const autoMap = autoRingMap(autoTargets)

  return visible.map((person) => {
    const resolvedRing = resolveRing(person, autoMap)
    const layoutRing = layoutRingFor(person, resolvedRing)
    return { ...person, resolvedRing, layoutRing }
  })
}

export function filterForDisplay(
  placed: PlacedPerson[],
  options: { showUnfollowed: boolean, ringOnly: DisplayRing | null },
): PlacedPerson[] {
  return placed.filter((person) => {
    if (!options.showUnfollowed && person.status === 'unfollowed')
      return false
    if (options.ringOnly !== null && person.layoutRing !== options.ringOnly)
      return false
    return true
  })
}

export function groupByLayoutRing(placed: PlacedPerson[]): Map<DisplayRing, PlacedPerson[]> {
  const groups = new Map<DisplayRing, PlacedPerson[]>()
  for (const ring of [1, 2, 3, 4] as const) {
    groups.set(ring, [])
  }
  for (const person of placed) {
    groups.get(person.layoutRing)!.push(person)
  }
  for (const list of groups.values())
    list.sort((a, b) => a.handle.localeCompare(b.handle))
  return groups
}
