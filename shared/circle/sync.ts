import type { Person } from './types.ts'

export interface SocialProfile {
  userId: string
  name: string
  handle: string
  avatarUrl: string
}

export interface TweetRef {
  id: string
  authorId: string
  mentionIds: string[]
  mentionHandles: string[]
  replyToId?: string
  quoteAuthorId?: string
  isRetweet: boolean
}

/** People who follow froQ and whom froQ follows. */
export function mutualOf(followers: SocialProfile[], following: SocialProfile[]): SocialProfile[] {
  const followed = new Set(following.map(profile => profile.userId))
  const seen = new Set<string>()
  const mutuals: SocialProfile[] = []
  for (const follower of followers) {
    if (!followed.has(follower.userId) || seen.has(follower.userId))
      continue
    seen.add(follower.userId)
    mutuals.push(follower)
  }
  return mutuals
}

/**
 * Keep sentences already written. Drop anyone who is no longer a mutual.
 * Hidden ids never come back.
 */
export function mergeRoster(previous: Person[], mutuals: SocialProfile[], hidden: ReadonlySet<string>, today: string): Person[] {
  const prior = new Map(previous.map(person => [person.userId, person]))
  const next: Person[] = []
  for (const profile of mutuals) {
    if (hidden.has(profile.userId))
      continue
    const old = prior.get(profile.userId)
    const person: Person = {
      name: profile.name || old?.name || profile.handle,
      handle: profile.handle || old?.handle || '',
      userId: profile.userId,
      avatar: old?.avatar || `/avatars/${profile.userId}.jpg`,
      status: 'mutual',
      firstSeen: old?.firstSeen || today,
      unfollowedAt: null,
      hidden: false,
      ring: old?.ring ?? 'auto',
      platforms: old?.platforms ?? [],
      impression: old?.impression ?? '',
      timeline: old?.timeline ?? [],
      pinnedPosts: old?.pinnedPosts ?? [],
      interactions: old?.interactions ?? 0,
    }
    if (old?.aboutMe)
      person.aboutMe = old.aboutMe
    next.push(person)
  }
  next.sort((a, b) => a.handle.localeCompare(b.handle) || a.userId.localeCompare(b.userId))
  return next
}

export interface InteractionHit {
  tweetId: string
  userId: string
}

/** New reply, quote, or @ between froQ and a mutual. Already counted tweets are skipped. */
export function interactionHits(tweets: TweetRef[], mutualIds: ReadonlySet<string>, hostId: string, hostHandle: string, seen: ReadonlySet<string>): InteractionHit[] {
  const hits: InteractionHit[] = []
  const host = hostHandle.toLowerCase()
  for (const tweet of tweets) {
    if (!tweet.id || tweet.isRetweet || seen.has(tweet.id))
      continue
    const users = new Set<string>()
    if (tweet.authorId === hostId) {
      for (const id of tweet.mentionIds) {
        if (mutualIds.has(id))
          users.add(id)
      }
      if (tweet.replyToId && mutualIds.has(tweet.replyToId))
        users.add(tweet.replyToId)
      if (tweet.quoteAuthorId && mutualIds.has(tweet.quoteAuthorId))
        users.add(tweet.quoteAuthorId)
    }
    else if (mutualIds.has(tweet.authorId)) {
      const mentionsHost = tweet.mentionIds.includes(hostId)
        || tweet.mentionHandles.some(handle => handle.toLowerCase() === host)
      const repliesHost = tweet.replyToId === hostId
      const quotesHost = tweet.quoteAuthorId === hostId
      if (mentionsHost || repliesHost || quotesHost)
        users.add(tweet.authorId)
    }
    for (const userId of users)
      hits.push({ tweetId: tweet.id, userId })
  }
  return hits
}

/** Tweet ids already counted, newest last. A later week will not count them again. */
export function rememberTweets(previous: readonly string[], tweetIds: readonly string[], limit = 8000): string[] {
  const seen = new Set(previous)
  const next = [...previous]
  for (const id of tweetIds) {
    if (!id || seen.has(id))
      continue
    seen.add(id)
    next.push(id)
  }
  return next.length > limit ? next.slice(next.length - limit) : next
}

export function addHits(people: Person[], hits: InteractionHit[]): Person[] {
  if (hits.length === 0)
    return people
  const extra = new Map<string, number>()
  for (const hit of hits)
    extra.set(hit.userId, (extra.get(hit.userId) ?? 0) + 1)
  return people.map((person) => {
    const more = extra.get(person.userId) ?? 0
    return more === 0 ? person : { ...person, interactions: person.interactions + more }
  })
}
