/* eslint-disable test/no-import-node-test */
import type { Person } from './types.ts'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { filterForDisplay, placePeople, resolveRing, visiblePeople } from './ring-placement.ts'

function person(overrides: Partial<Person> & Pick<Person, 'userId' | 'handle'>): Person {
  return {
    name: overrides.name ?? overrides.handle,
    handle: overrides.handle,
    userId: overrides.userId,
    avatar: `/avatars/${overrides.userId}.svg`,
    status: overrides.status ?? 'mutual',
    firstSeen: overrides.firstSeen ?? '2024-01-01',
    unfollowedAt: overrides.unfollowedAt ?? null,
    hidden: overrides.hidden ?? false,
    ring: overrides.ring ?? 'auto',
    platforms: overrides.platforms ?? [],
    impression: overrides.impression ?? '',
    timeline: overrides.timeline ?? [],
    pinnedPosts: overrides.pinnedPosts ?? [],
    interactions: overrides.interactions ?? 0,
  }
}

describe('ring placement', () => {
  it('excludes hidden people from placement', () => {
    const people = [
      person({ userId: 'a', handle: 'a', hidden: true }),
      person({ userId: 'b', handle: 'b' }),
    ]
    assert.equal(visiblePeople(people).length, 1)
    assert.equal(placePeople(people).length, 1)
  })

  it('respects manual ring overrides', () => {
    const people = [person({ userId: 'a', handle: 'a', ring: 2 })]
    const placed = placePeople(people)
    const first = placed[0]!
    assert.equal(first.resolvedRing, 2)
    assert.equal(first.layoutRing, 2)
  })

  it('auto ring assigns tiers 1–3', () => {
    const people = [
      person({ userId: '1', handle: 'one', firstSeen: '2020-01-01', interactions: 100 }),
      person({ userId: '2', handle: 'two', firstSeen: '2021-06-01', interactions: 50 }),
      person({ userId: '3', handle: 'three', firstSeen: '2023-01-01', interactions: 10 }),
    ]
    const placed = placePeople(people)
    const rings = new Set(placed.map(p => p.resolvedRing))
    assert.ok(rings.has(1))
    assert.ok([1, 2, 3].every(r => rings.has(r as 1 | 2 | 3) || placed.length < 3))
    assert.equal(placed.find(p => p.userId === '1')!.resolvedRing, 1)
  })

  it('unfollowed stay on resolved ring by default', () => {
    const people = [person({ userId: 'u', handle: 'u', status: 'unfollowed', ring: 2 })]
    const placed = placePeople(people)
    assert.equal(placed[0]!.layoutRing, 2)
  })

  it('filter hides unfollowed unless toggled', () => {
    const people = [
      person({ userId: 'a', handle: 'a' }),
      person({ userId: 'b', handle: 'b', status: 'unfollowed' }),
    ]
    const placed = placePeople(people)
    assert.equal(filterForDisplay(placed, { showUnfollowed: false, ringOnly: null }).length, 1)
    assert.equal(filterForDisplay(placed, { showUnfollowed: true, ringOnly: null }).length, 2)
  })

  it('resolveRing uses auto map', () => {
    const autoMap = new Map([['x', 1 as const]])
    assert.equal(resolveRing(person({ userId: 'x', handle: 'x', ring: 'auto' }), autoMap), 1)
  })
})
