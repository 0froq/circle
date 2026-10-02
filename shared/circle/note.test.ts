/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { notePieces, noteText } from './note.ts'

describe('note text', () => {
  it('keeps line breaks typed in a string', () => {
    assert.equal(noteText('第一句。\n第二句'), '第一句。\n第二句')
    assert.equal(noteText('第一句。\n\n第二句'), '第一句。\n\n第二句')
  })

  it('joins JSON lines, including a break inside code', () => {
    assert.equal(
      noteText(['第一句。', '第二句，带一个 `code', '换行`。', '', '结尾']),
      '第一句。\n第二句，带一个 `code\n换行`。\n\n结尾',
    )
  })

  it('turns an http(s) markdown link into a link and leaves other schemes as text', () => {
    assert.deepEqual(notePieces('看[链接](https://example.com/a)。'), [
      { type: 'text', text: '看' },
      { type: 'link', text: '链接', url: 'https://example.com/a' },
      { type: 'text', text: '。' },
    ])
    assert.deepEqual(notePieces('[不点](javascript:alert(1))'), [
      { type: 'text', text: '[不点](javascript:alert(1))' },
    ])
  })

  it('keeps a link inside code as code', () => {
    assert.deepEqual(notePieces('`[链接](https://example.com)`'), [
      { type: 'code', text: '[链接](https://example.com)' },
    ])
  })

  it('treats blank input as unwritten', () => {
    assert.equal(noteText(''), '')
    assert.equal(noteText('  \n'), '')
    assert.equal(noteText(['', '  ']), '')
    assert.equal(noteText(undefined), '')
  })
})
