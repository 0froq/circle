import type { SocialProfile, TweetRef } from '../shared/circle/sync.ts'
import type { PeopleFile, Person } from '../shared/circle/types.ts'
import { Buffer } from 'node:buffer'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { addHits, interactionHits, mergeRoster, mutualOf, rememberTweets } from '../shared/circle/sync.ts'

const HOST_ID = '2014278794920787968'
const HOST_HANDLE = '0froQ'
const PEOPLE_PATH = new URL('../data/people.json', import.meta.url)
const HIDDEN_PATH = new URL('../data/hidden.json', import.meta.url)
const SYNC_PATH = new URL('../data/sync.json', import.meta.url)
const AVATAR_DIR = new URL('../public/avatars/', import.meta.url)

const key = process.env.SOCIALDATA_API_KEY
if (!key) {
  console.error('SOCIALDATA_API_KEY is missing')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${key}`,
  Accept: 'application/json',
}

interface SyncFile {
  since: number
  seen: string[]
}

async function api(path: string): Promise<unknown> {
  const response = await fetch(`https://api.socialdata.tools${path}`, { headers })
  if (response.status === 402) {
    console.error('SocialData balance is empty, skip')
    process.exit(0)
  }
  if (!response.ok)
    throw new Error(`${response.status} ${path}`)
  return response.json()
}

async function listUsers(kind: 'followers' | 'following'): Promise<SocialProfile[]> {
  const profiles: SocialProfile[] = []
  let cursor = ''
  for (let page = 0; page < 40; page += 1) {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
    const body = await api(`/twitter/user/${HOST_ID}/${kind}${query}`) as {
      next_cursor?: string
      users?: Array<Record<string, unknown>>
    }
    for (const user of body.users ?? []) {
      const userId = String(user.id_str ?? user.id ?? '')
      if (!userId)
        continue
      profiles.push({
        userId,
        name: String(user.name ?? ''),
        handle: String(user.screen_name ?? ''),
        avatarUrl: String(user.profile_image_url_https ?? ''),
      })
    }
    if (!body.next_cursor || (body.users ?? []).length === 0)
      break
    cursor = body.next_cursor
  }
  return profiles
}

function asTweet(raw: Record<string, unknown>): TweetRef | null {
  const id = String(raw.id_str ?? raw.id ?? '')
  const user = raw.user as Record<string, unknown> | undefined
  const authorId = String(user?.id_str ?? user?.id ?? raw.author_id ?? '')
  if (!id || !authorId)
    return null
  const entities = raw.entities as { user_mentions?: Array<Record<string, unknown>> } | undefined
  const mentions = entities?.user_mentions ?? []
  const quoted = raw.quoted_status as Record<string, unknown> | undefined
  const quotedUser = quoted?.user as Record<string, unknown> | undefined
  return {
    id,
    authorId,
    mentionIds: mentions.map(mention => String(mention.id_str ?? mention.id ?? '')).filter(Boolean),
    mentionHandles: mentions.map(mention => String(mention.screen_name ?? '')).filter(Boolean),
    replyToId: raw.in_reply_to_user_id_str ? String(raw.in_reply_to_user_id_str) : undefined,
    quoteAuthorId: quotedUser ? String(quotedUser.id_str ?? quotedUser.id ?? '') || undefined : undefined,
    isRetweet: raw.retweeted_status != null,
  }
}

async function search(query: string): Promise<TweetRef[]> {
  const tweets: TweetRef[] = []
  let cursor = ''
  for (let page = 0; page < 30; page += 1) {
    const params = new URLSearchParams({ query, type: 'Latest' })
    if (cursor)
      params.set('cursor', cursor)
    const body = await api(`/twitter/search?${params}`) as {
      next_cursor?: string
      tweets?: Array<Record<string, unknown>>
      statuses?: Array<Record<string, unknown>>
    }
    const rows = body.tweets ?? body.statuses ?? []
    for (const row of rows) {
      const tweet = asTweet(row)
      if (tweet)
        tweets.push(tweet)
    }
    if (!body.next_cursor || rows.length === 0)
      break
    cursor = body.next_cursor
  }
  return tweets
}

function localAvatar(person: Person): URL {
  const name = person.avatar.replace(/^\/avatars\//, '')
  return new URL(name, AVATAR_DIR)
}

async function saveAvatar(person: Person, remote: string): Promise<void> {
  if (!remote)
    return
  const larger = remote.replace('_normal.', '_400x400.')
  const response = await fetch(larger)
  if (!response.ok)
    return
  const type = response.headers.get('content-type') ?? ''
  const ext = type.includes('png') ? 'png' : 'jpg'
  const bytes = Buffer.from(await response.arrayBuffer())
  const file = new URL(`${person.userId}.${ext}`, AVATAR_DIR)
  await writeFile(file, bytes)
  person.avatar = `/avatars/${person.userId}.${ext}`
}

async function main(): Promise<void> {
  const file = JSON.parse(await readFile(PEOPLE_PATH, 'utf8')) as PeopleFile
  const hidden = new Set<string>(JSON.parse(await readFile(HIDDEN_PATH, 'utf8')) as string[])
  const followers = await listUsers('followers')
  const following = await listUsers('following')
  const today = new Date().toISOString().slice(0, 10)
  let people = mergeRoster(file.people, mutualOf(followers, following), hidden, today)

  let sync: SyncFile = { since: Math.floor(Date.now() / 1000), seen: [] }
  const firstRun = !existsSync(SYNC_PATH)
  if (!firstRun)
    sync = JSON.parse(await readFile(SYNC_PATH, 'utf8')) as SyncFile

  const seen = new Set(sync.seen ?? [])
  let tweetIds: string[] = []
  if (!firstRun) {
    const since = sync.since
    const tweets = [
      ...await search(`from:${HOST_HANDLE} since_time:${since}`),
      ...await search(`@${HOST_HANDLE} -from:${HOST_HANDLE} since_time:${since}`),
    ]
    const mutualIds = new Set(people.map(person => person.userId))
    const hits = interactionHits(tweets, mutualIds, HOST_ID, HOST_HANDLE, seen)
    people = addHits(people, hits)
    tweetIds = tweets.map(tweet => tweet.id)
    console.log(`tweets ${tweets.length}, new hits ${hits.length}`)
  }
  else {
    console.log('first run records the cursor and keeps the interaction counts already in the file')
  }

  for (const person of people) {
    const profile = followers.find(item => item.userId === person.userId)
    if (profile?.avatarUrl && !existsSync(localAvatar(person)))
      await saveAvatar(person, profile.avatarUrl)
  }

  file.people = people
  const nextSync: SyncFile = {
    since: Math.floor(Date.now() / 1000),
    seen: rememberTweets(sync.seen ?? [], tweetIds),
  }
  await writeFile(PEOPLE_PATH, `${JSON.stringify(file, null, 2)}\n`)
  await writeFile(SYNC_PATH, `${JSON.stringify(nextSync, null, 2)}\n`)
  console.log(`mutuals ${people.length}`)
}

await main()
