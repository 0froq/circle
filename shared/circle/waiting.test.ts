/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { WAITING_LINE_COUNT, waitingLineIndex } from './waiting.ts'

describe('waiting lines', () => {
  it('keeps the same slot for the same id', () => {
    assert.equal(waitingLineIndex('2085321127182884864'), waitingLineIndex('2085321127182884864'))
  })

  it('stays inside the shared sentence list', () => {
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const index = waitingLineIndex(id)
      assert.ok(index >= 0 && index < WAITING_LINE_COUNT)
    }
    const lines = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => waitingLineIndex(id))
    assert.ok(new Set(lines).size > 1)
  })

  it('gives every locale the same number of sentences', () => {
    for (const locale of ['en', 'zh', 'ja']) {
      const file = JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}.json`, import.meta.url), 'utf8')) as {
        circle: { waiting?: unknown }
      }
      assert.ok(Array.isArray(file.circle.waiting))
      assert.equal(file.circle.waiting.length, WAITING_LINE_COUNT)
    }
  })
})
