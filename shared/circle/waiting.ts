import { hashString } from './layout.ts'

/** Shown when froQ has not written this person yet. The same id always lands on the same line. */
const WAITING_LINES = [
  '你的轮廓我还在慢慢对齐。',
  '这句话先留白，等我再认识你一点。',
  '人已经在这里了，句子还在赶来。',
  '我想把你看清楚，再落笔。',
  '有一个位置是你的，字还没到。',
  '熟一点之后，这句话会自己长出来。',
  '我先记住你在，具体的话稍后再写。',
  '眼下只有问候的意思，还不是一句完整的话。',
] as const

export function waitingLine(userId: string): string {
  const index = hashString(userId) % WAITING_LINES.length
  return WAITING_LINES[index] ?? WAITING_LINES[0]
}
