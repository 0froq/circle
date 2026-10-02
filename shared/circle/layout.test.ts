/* eslint-disable test/no-import-node-test */
import type { Person } from './types.ts'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { AVATAR_SIZE, layoutBoard, visiblePeople } from './layout.ts'

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
    platforms: [],
    impression: '',
    timeline: [],
    interactions: overrides.interactions ?? 0,
  }
}

describe('board layout', () => {
  it('drops hidden people', () => {
    const people = [
      person({ userId: 'a', handle: 'a', hidden: true }),
      person({ userId: 'b', handle: 'b' }),
    ]
    assert.equal(visiblePeople(people).length, 1)
    assert.equal(layoutBoard(visiblePeople(people)).nodes.length, 1)
  })

  it('drops anyone who is not a mutual', () => {
    const people = visiblePeople([
      person({ userId: 'a', handle: 'a' }),
      person({ userId: 'u', handle: 'u', status: 'unfollowed' }),
      person({ userId: 'f', handle: 'f', status: 'followsMe' }),
    ])
    assert.deepEqual(people.map(person => person.userId), ['a'])
  })

  it('does not move a person when score-like fields change', () => {
    const quiet = layoutBoard([person({
      userId: 'same',
      handle: 'same',
      interactions: 0,
      firstSeen: '2024-12-01',
      ring: 3,
    })])
    const loud = layoutBoard([person({
      userId: 'same',
      handle: 'same',
      interactions: 999,
      firstSeen: '2016-01-01',
      ring: 1,
    })])
    assert.equal(quiet.nodes[0]!.x, loud.nodes[0]!.x)
    assert.equal(quiet.nodes[0]!.y, loud.nodes[0]!.y)
    assert.equal(quiet.nodes[0]!.size, loud.nodes[0]!.size)
  })

  it('gives every face the same size', () => {
    const board = layoutBoard([
      person({ userId: '1', handle: 'one', interactions: 1 }),
      person({ userId: '2', handle: 'two', interactions: 400 }),
    ])
    assert.ok(board.nodes.every(node => node.size === AVATAR_SIZE))
  })

  it('is stable for the same ids', () => {
    const people = [
      person({ userId: 'b', handle: 'b' }),
      person({ userId: 'a', handle: 'a' }),
    ]
    const first = layoutBoard(people)
    const second = layoutBoard([...people].reverse())
    assert.deepEqual(
      first.nodes.map(node => [node.person.userId, node.x, node.y]),
      second.nodes.map(node => [node.person.userId, node.x, node.y]),
    )
  })
})
