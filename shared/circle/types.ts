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
  /** Stored for the data pipeline. The board does not read this. */
  ring: RingInput
  platforms: PlatformLink[]
  /** What froQ has written about this person. Empty uses a seeded waiting line. */
  impression: string
  /** What this person wrote about froQ. Empty keeps that tab shut. */
  aboutMe?: string
  timeline: TimelineEntry[]
  pinnedPosts: PinnedPost[]
  interactions: number
}

export interface PeopleFile {
  version: 1
  /** Identity of the circle. The board does not draw this avatar. */
  center: {
    name: string
    handle: string
    avatar: string
  }
  people: Person[]
}
