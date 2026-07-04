export const DRAMA_SKIN_STORAGE_KEY = 'drama.activeSkin'

export type DramaSkinId =
  | 'drama-classic'
  | 'host-follow'
  | 'zen-follow'
  | 'warp-midnight'
  | 'solar-script'
  | 'paper-light'
  | 'jade-glass'
  | 'opal-bloom'
  | 'triad-soft'

export interface DramaSkin {
  id: DramaSkinId
  label: string
  shortLabel: string
  description: string
}

export const DRAMA_SKINS: DramaSkin[] = [
  {
    id: 'drama-classic',
    label: 'Drama Classic',
    shortLabel: 'Classic',
    description: '当前 Drama 深色工作台',
  },
  {
    id: 'host-follow',
    label: 'Follow Host',
    shortLabel: 'Host',
    description: '跟随当前浏览器宿主主色和圆角',
  },
  {
    id: 'warp-midnight',
    label: 'Warp Midnight',
    shortLabel: 'Midnight',
    description: 'Warp 风格的高对比暗色工作台',
  },
  {
    id: 'solar-script',
    label: 'Solar Script',
    shortLabel: 'Solar',
    description: '暖色写作和审稿工作台',
  },
  {
    id: 'paper-light',
    label: 'Paper Light',
    shortLabel: 'Paper',
    description: '亮色纸面写作模式',
  },
  {
    id: 'jade-glass',
    label: 'Jade Glass',
    shortLabel: 'Jade',
    description: '玉石绿白的半透明创作基底',
  },
  {
    id: 'opal-bloom',
    label: 'Opal Bloom',
    shortLabel: 'Opal',
    description: '粉蓝欧泊的柔光创作基底',
  },
  {
    id: 'triad-soft',
    label: 'Triad Soft',
    shortLabel: 'Triad',
    description: '奶白、陶土、炭灰的三色柔光按钮皮肤',
  },
]

const DRAMA_SKIN_IDS = new Set(DRAMA_SKINS.map((skin) => skin.id))

function normalizeLegacyDramaSkinId(value: string | null | undefined): string | null | undefined {
  return value === 'zen-follow' ? 'host-follow' : value
}

export function isDramaSkinId(value: string | null | undefined): value is DramaSkinId {
  const normalized = normalizeLegacyDramaSkinId(value)
  return typeof normalized === 'string' && DRAMA_SKIN_IDS.has(normalized as DramaSkinId)
}

export function resolveDramaSkinId(
  value: string | null | undefined,
  fallback: DramaSkinId = 'drama-classic',
): DramaSkinId {
  const normalized = normalizeLegacyDramaSkinId(value)
  return isDramaSkinId(normalized) ? normalized : fallback
}

export function getInitialDramaSkinId(fallback: DramaSkinId = 'drama-classic'): DramaSkinId {
  const params = new URLSearchParams(globalThis.location?.search ?? '')
  const urlSkin = params.get('skin')
  if (isDramaSkinId(urlSkin)) return urlSkin

  try {
    return resolveDramaSkinId(globalThis.localStorage?.getItem(DRAMA_SKIN_STORAGE_KEY), fallback)
  } catch {
    return fallback
  }
}

export function persistDramaSkinId(skinId: DramaSkinId): void {
  try {
    globalThis.localStorage?.setItem(DRAMA_SKIN_STORAGE_KEY, skinId)
  } catch {
    // Local storage can be unavailable inside restricted chrome contexts.
  }
}

export function applyDramaSkin(skinId: DramaSkinId): void {
  const root = globalThis.document?.documentElement
  if (!root) return
  root.dataset.dramaSkin = skinId
}
