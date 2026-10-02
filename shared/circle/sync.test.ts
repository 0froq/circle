/* eslint-disable test/no-import-node-test */
import type { SocialProfile, TweetRef } from './sync.ts'
import type { Person } from './types.ts'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addHits, interactionHits, mergeRoster, mutualOf, profileAvatar, rememberTweets } from './sync.ts'

function profile(userId: string, handle = userId): SocialProfile {
  return { userId, name: handle, handle, avatarUrl: '' }
}

function person(userId: string, extra: Partial<Person> = {}): Person {
  return {
    name: extra.name ?? userId,
    handle: extra.handle ?? userId,
    avatar: `/avatars/${userId}.jpg`,
    status: 'mutual',
    firstSeen: '2026-09-28',
    unfollowedAt: null,
    hidden: false,
    ring: 'auto',
    platforms: [],
    impression: extra.impression ?? '',
    timeline: [],
    interactions: extra.interactions ?? 0,
    ...extra,
    userId,
  }
}

function tweet(extra: Partial<TweetRef> & Pick<TweetRef, 'id' | 'authorId'>): TweetRef {
  return {
    mentionIds: [],
    mentionHandles: [],
    isRetweet: false,
    ...extra,
  }
}

describe('mutual roster', () => {
  it('keeps only people on both lists', () => {
    const mutuals = mutualOf(
      [profile('a'), profile('b'), profile('a')],
      [profile('b'), profile('c')],
    )
    assert.deepEqual(mutuals.map(item => item.userId), ['b'])
  })

  it('preserves sentences and drops people who are no longer mutual', () => {
    const previous = [
      person('keep', { impression: '已写下', interactions: 4, aboutMe: '写给我' }),
      person('gone', { impression: '旧句子', status: 'followsMe' }),
    ]
    const next = mergeRoster(previous, [profile('keep', 'kept'), profile('hidden-one')], new Set(['hidden-one']), '2026-09-30')
    assert.deepEqual(next.map(item => item.userId), ['keep'])
    assert.equal(next[0]?.impression, '已写下')
    assert.equal(next[0]?.aboutMe, '写给我')
    assert.equal(next[0]?.interactions, 4)
    assert.equal(next[0]?.handle, 'kept')
    assert.equal(next[0]?.status, 'mutual')
    assert.equal(next[0]?.avatar, '/avatars/keep.jpg')
  })

  it('stores the remote 400px address and does not invent a local file', () => {
    const remote = profile('a')
    remote.avatarUrl = 'https://pbs.twimg.com/profile_images/1/a_normal.jpg'
    const next = mergeRoster([], [remote], new Set(), '2026-09-30')
    assert.equal(next[0]?.avatar, 'https://pbs.twimg.com/profile_images/1/a_400x400.jpg')
    assert.equal(profileAvatar(''), '')
  })
})

describe('interaction hits', () => {
  const mutuals = new Set(['m'])

  it('counts a reply either way and ignores retweets and repeats', () => {
    const tweets = [
      tweet({ id: '1', authorId: 'host', replyToId: 'm' }),
      tweet({ id: '2', authorId: 'm', mentionHandles: ['0froQ'] }),
      tweet({ id: '3', authorId: 'host', mentionIds: ['m'], isRetweet: true }),
      tweet({ id: '1', authorId: 'host', replyToId: 'm' }),
    ]
    const hits = interactionHits(tweets, mutuals, 'host', '0froQ', new Set(['1']))
    assert.deepEqual(hits, [{ tweetId: '2', userId: 'm' }])
  })

  it('keeps tweet ids already counted and drops the oldest past the cap', () => {
    const kept = rememberTweets(['1', '2'], ['2', '3'], 3)
    assert.deepEqual(kept, ['1', '2', '3'])
    assert.deepEqual(rememberTweets(['1', '2', '3'], ['4'], 3), ['2', '3', '4'])
  })

  it('adds hits onto the existing count', () => {
    const updated = addHits(
      [person('m', { interactions: 3 })],
      [{ tweetId: '9', userId: 'm' }, { tweetId: '10', userId: 'm' }],
    )
    assert.equal(updated[0]?.interactions, 5)
  })
})
