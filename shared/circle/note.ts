/** A sentence, or one line per item so a JSON file can break lines without `\n`. */
export type NoteInput = string | readonly string[]

export type NotePiece
  = { type: 'text', text: string }
    | { type: 'code', text: string }
    | { type: 'link', text: string, url: string }

const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g

/**
 * Text ready to draw. A string keeps its own line breaks.
 * A line list is joined with newlines, including inside `backticks`.
 * Blank means nothing was written.
 */
export function noteText(value: NoteInput | null | undefined): string {
  if (value == null)
    return ''
  const text = typeof value === 'string' ? value : value.join('\n')
  return text.trim()
}

/** Inline pieces for a note: `` `code` `` and `[label](https://…)` links. */
export function notePieces(text: string): NotePiece[] {
  const pieces: NotePiece[] = []
  const parts = text.split('`')
  parts.forEach((part, index) => {
    if (part === '')
      return
    if (index % 2 === 1)
      pieces.push({ type: 'code', text: part })
    else
      pieces.push(...linkPieces(part))
  })
  return pieces
}

function linkPieces(text: string): NotePiece[] {
  const pieces: NotePiece[] = []
  let last = 0
  for (const match of text.matchAll(LINK)) {
    const index = match.index ?? 0
    const label = match[1]
    const url = match[2] ? httpUrl(match[2]) : null
    if (!label || !url)
      continue
    if (index > last)
      pieces.push({ type: 'text', text: text.slice(last, index) })
    pieces.push({ type: 'link', text: label, url })
    last = index + match[0].length
  }
  if (last < text.length)
    pieces.push({ type: 'text', text: text.slice(last) })
  return pieces
}

function httpUrl(raw: string): string | null {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
      return null
    return url.href
  }
  catch {
    return null
  }
}
