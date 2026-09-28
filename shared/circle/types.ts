export type PersonStatus = 'mutual' | 'followsMe' | 'iFollow' | 'unfollowed'

export type RingInput = 'auto' | 1 | 2 | 3 | 4

export interface PlatformLink {
  name: string
  url: string
}

export interface TimelineEntry {
  date: string
  text: string
}

export interface PinnedPost {
  url: string
  text: string
  date: string
  images?: string[]
}

export interface Person {
  name: string
  handle: string
  userId: string
  avatar: string
  status: PersonStatus
  firstSeen: string
  unfollowedAt?: string | null
  hidden: boolean
  ring: RingInput
  platforms: PlatformLink[]
  impression: string
  timeline: TimelineEntry[]
  pinnedPosts: PinnedPost[]
  interactions: number
}

export type DisplayRing = 1 | 2 | 3 | 4

export interface PlacedPerson extends Person {
  /** Ring after auto scoring and manual overrides (before unfollowed display tweak). */
  resolvedRing: DisplayRing
  /** Ring used for layout and filters (may force ring 4 for unfollowed). */
  layoutRing: DisplayRing
}

export interface PeopleFile {
  version: 1
  center: {
    name: string
    handle: string
    avatar: string
  }
  people: Person[]
}
