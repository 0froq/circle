import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Overwrites data/people.json and public/avatars with fiction. Do not run against the Notion snapshot.
const root = join(import.meta.dirname, '..')
const avatarDir = join(root, 'public', 'avatars')
const dataDir = join(root, 'data')
mkdirSync(avatarDir, { recursive: true })
mkdirSync(dataDir, { recursive: true })

const palettes = [
  ['#e8431f', '#f4f2ec'],
  ['#2d6a4f', '#f4f2ec'],
  ['#1d3557', '#f4f2ec'],
  ['#6d597a', '#f4f2ec'],
  ['#bc6c25', '#f4f2ec'],
  ['#40916c', '#111113'],
  ['#ff6242', '#111113'],
]

function avatarSvg(id, label) {
  const [fg, bg] = palettes[hash(id) % palettes.length]
  const initial = label.slice(0, 1).toUpperCase()
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${label}">
  <rect width="96" height="96" rx="48" fill="${bg}"/>
  <circle cx="48" cy="48" r="44" fill="none" stroke="${fg}" stroke-width="2" opacity="0.35"/>
  <text x="48" y="54" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="${fg}">${initial}</text>
</svg>`
}

function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const seeds = [
  { name: '纸鸢阿七', handle: 'mock_kite_07', status: 'mutual', ring: 'auto', firstSeen: '2019-03-12', interactions: 142, hidden: false },
  { name: '墨线白川', handle: 'mock_pen_bai', status: 'mutual', ring: 1, firstSeen: '2018-11-02', interactions: 210, hidden: false },
  { name: '星图小鹿', handle: 'mock_deer_map', status: 'mutual', ring: 'auto', firstSeen: '2020-01-18', interactions: 88, hidden: false },
  { name: '回声拾穗', handle: 'mock_echo_harvest', status: 'followsMe', ring: 'auto', firstSeen: '2021-04-09', interactions: 34, hidden: false },
  { name: '半糖电台', handle: 'mock_half_sugar', status: 'iFollow', ring: 3, firstSeen: '2022-07-21', interactions: 19, hidden: false },
  { name: '夜航罐头', handle: 'mock_night_can', status: 'mutual', ring: 'auto', firstSeen: '2019-09-30', interactions: 76, hidden: false },
  { name: '折纸彗星', handle: 'mock_comet_fold', status: 'mutual', ring: 2, firstSeen: '2020-06-14', interactions: 55, hidden: false },
  { name: '雾都铅笔', handle: 'mock_fog_pencil', status: 'mutual', ring: 'auto', firstSeen: '2023-02-02', interactions: 12, hidden: false },
  { name: '青柠手账', handle: 'mock_lime_journal', status: 'mutual', ring: 'auto', firstSeen: '2021-12-01', interactions: 41, hidden: false },
  { name: '北风邮差', handle: 'mock_north_post', status: 'unfollowed', ring: 'auto', firstSeen: '2018-05-20', interactions: 67, unfollowedAt: '2025-11-03', hidden: false },
  { name: '云朵焊工', handle: 'mock_cloud_weld', status: 'mutual', ring: 'auto', firstSeen: '2022-03-08', interactions: 28, hidden: false },
  { name: '沙洲程序员', handle: 'mock_sand_dev', status: 'mutual', ring: 'auto', firstSeen: '2020-10-10', interactions: 93, hidden: false },
  { name: '柚子观测站', handle: 'mock_yuzu_watch', status: 'followsMe', ring: 'auto', firstSeen: '2024-01-15', interactions: 8, hidden: false },
  { name: '苔原旅人', handle: 'mock_moss_walker', status: 'mutual', ring: 'auto', firstSeen: '2019-07-07', interactions: 120, hidden: false },
  { name: '像素茶室', handle: 'mock_pixel_tea', status: 'mutual', ring: 2, firstSeen: '2021-08-19', interactions: 47, hidden: false },
  { name: '虚构档案员', handle: 'mock_fake_arch', status: 'iFollow', ring: 'auto', firstSeen: '2023-06-06', interactions: 15, hidden: false },
  { name: '雨声编译器', handle: 'mock_rain_build', status: 'mutual', ring: 'auto', firstSeen: '2018-12-24', interactions: 165, hidden: false },
  { name: '慢速火箭', handle: 'mock_slow_rocket', status: 'mutual', ring: 'auto', firstSeen: '2022-11-11', interactions: 22, hidden: true },
  { name: '海盐相框', handle: 'mock_salt_frame', status: 'mutual', ring: 'auto', firstSeen: '2020-04-04', interactions: 61, hidden: false },
  { name: '路灯诗人', handle: 'mock_lamp_poet', status: 'unfollowed', ring: 2, firstSeen: '2019-02-14', interactions: 38, unfollowedAt: '2026-01-20', hidden: false },
  { name: '空白样本', handle: 'mock_blank_sample', status: 'mutual', ring: 'auto', firstSeen: '2024-08-08', interactions: 5, hidden: false },
  { name: '胡桃夹子', handle: 'mock_nutcracker', status: 'mutual', ring: 'auto', firstSeen: '2017-10-31', interactions: 188, hidden: false },
  { name: '潜水番茄', handle: 'mock_dive_tomato', status: 'mutual', ring: 3, firstSeen: '2021-01-01', interactions: 33, hidden: false },
  { name: '纸船调度', handle: 'mock_boat_ops', status: 'followsMe', ring: 'auto', firstSeen: '2023-09-09', interactions: 11, hidden: false },
  { name: '晨光补丁', handle: 'mock_dawn_patch', status: 'mutual', ring: 'auto', firstSeen: '2020-02-29', interactions: 72, hidden: false },
  { name: '虚构邻居', handle: 'mock_fake_neighbor', status: 'mutual', ring: 'auto', firstSeen: '2022-05-05', interactions: 26, hidden: false },
  { name: '风铃数据库', handle: 'mock_chime_db', status: 'iFollow', ring: 4, firstSeen: '2024-03-03', interactions: 3, hidden: false },
  { name: '橡皮宇宙', handle: 'mock_eraser_cosmo', status: 'mutual', ring: 'auto', firstSeen: '2018-08-08', interactions: 131, hidden: false },
  { name: '离线蝴蝶', handle: 'mock_offline_moth', status: 'mutual', ring: 'auto', firstSeen: '2021-05-15', interactions: 44, hidden: false },
  { name: '测试旅客甲', handle: 'mock_traveler_a', status: 'mutual', ring: 'auto', firstSeen: '2019-04-01', interactions: 99, hidden: false },
  { name: '测试旅客乙', handle: 'mock_traveler_b', status: 'mutual', ring: 'auto', firstSeen: '2020-12-12', interactions: 58, hidden: false },
  { name: '测试旅客丙', handle: 'mock_traveler_c', status: 'unfollowed', ring: 'auto', firstSeen: '2017-01-01', interactions: 24, unfollowedAt: '2025-06-01', hidden: false },
  { name: '测试旅客丁', handle: 'mock_traveler_d', status: 'mutual', ring: 'auto', firstSeen: '2023-11-11', interactions: 17, hidden: false },
  { name: '测试旅客戊', handle: 'mock_traveler_e', status: 'followsMe', ring: 'auto', firstSeen: '2022-08-08', interactions: 21, hidden: false },
  { name: '测试旅客己', handle: 'mock_traveler_f', status: 'mutual', ring: 1, firstSeen: '2016-06-06', interactions: 201, hidden: false },
  { name: '测试旅客庚', handle: 'mock_traveler_g', status: 'mutual', ring: 'auto', firstSeen: '2024-02-02', interactions: 9, hidden: false },
  { name: '测试旅客辛', handle: 'mock_traveler_h', status: 'iFollow', ring: 'auto', firstSeen: '2021-10-10', interactions: 27, hidden: false },
  { name: '测试旅客壬', handle: 'mock_traveler_i', status: 'mutual', ring: 'auto', firstSeen: '2018-03-03', interactions: 112, hidden: false },
  { name: '测试旅客癸', handle: 'mock_traveler_j', status: 'mutual', ring: 'auto', firstSeen: '2020-07-07', interactions: 63, hidden: false },
  { name: '占位隐藏人', handle: 'mock_hidden_only', status: 'mutual', ring: 'auto', firstSeen: '2015-01-01', interactions: 300, hidden: true },
]

const people = seeds.map((seed, index) => {
  const userId = `mock_${String(index + 1).padStart(3, '0')}`
  const file = `${userId}.svg`
  writeFileSync(join(avatarDir, file), avatarSvg(userId, seed.name), 'utf8')
  return {
    name: seed.name,
    handle: seed.handle,
    userId,
    avatar: `/avatars/${file}`,
    status: seed.status,
    firstSeen: seed.firstSeen,
    unfollowedAt: seed.unfollowedAt ?? null,
    hidden: seed.hidden,
    ring: 'auto',
    platforms: seed.handle.includes('tea')
      ? [{ name: '小红书', url: 'https://example.com/placeholder/xhs' }]
      : [{ name: 'X', url: `https://x.com/${seed.handle}` }],
    impression: `占位印象：和 ${seed.name} 在 mock 数据里击掌。`,
    timeline: [
      { date: seed.firstSeen, text: '第一次在快照里出现（假）' },
      { date: '2025-01-01', text: '线下面基（虚构）' },
    ],
    pinnedPosts: [{
      url: `https://x.com/${seed.handle}/status/000000000000000000`,
      text: '占位帖：一句假引用，不嵌 X 脚本。',
      date: '2025-06-01',
    }],
    interactions: seed.interactions,
  }
})

writeFileSync(join(avatarDir, 'froq.svg'), avatarSvg('froq', 'froQ'), 'utf8')

const payload = {
  version: 1,
  center: {
    name: 'froQ',
    handle: '0froq',
    avatar: '/avatars/froq.svg',
  },
  people,
}

writeFileSync(join(root, 'data', 'people.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`Wrote ${people.length} people and avatars`)
