export const DRAMA_SKIN_STORAGE_KEY = 'drama.activeSkin'

export type DramaSkinId =
  | 'drama-classic'
  | 'zen-follow'
  | 'warp-midnight'
  | 'solar-script'
  | 'paper-light'
  | 'jade-glass'
  | 'opal-bloom'

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
    id: 'zen-follow',
    label: 'Follow Zen',
    shortLabel: 'Zen',
    description: '跟随 Zen Browser 主色和圆角',
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
]

const DRAMA_SKIN_IDS = new Set(DRAMA_SKINS.map((skin) => skin.id))

export function isDramaSkinId(value: string | null | undefined): value is DramaSkinId {
  return typeof value === 'string' && DRAMA_SKIN_IDS.has(value as DramaSkinId)
}

export function resolveDramaSkinId(
  value: string | null | undefined,
  fallback: DramaSkinId = 'drama-classic',
): DramaSkinId {
  return isDramaSkinId(value) ? value : fallback
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
