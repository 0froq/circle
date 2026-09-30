/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { waitingLine } from './waiting.ts'

describe('waiting lines', () => {
  it('keeps the same sentence for the same id', () => {
    assert.equal(waitingLine('2085321127182884864'), waitingLine('2085321127182884864'))
  })

  it('can differ across ids', () => {
    const lines = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => waitingLine(id))
    assert.ok(new Set(lines).size > 1)
  })
})
