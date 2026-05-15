// ══════════════════════════════════════════════════════════════════
//  MERIDIAN ROOM — Theme Engine  v1.0
//  Design Token + Theme Preset System
// ══════════════════════════════════════════════════════════════════

export type ThemeId = 'light' | 'dark' | 'night'

export type FontId = 'prompt' | 'inter' | 'kanit'
export type RadiusSize = 'none' | 'sm' | 'md' | 'lg' | 'xl'
export type DensityMode = 'compact' | 'comfortable' | 'spacious'

export interface UserThemePrefs {
  theme: ThemeId
  font: FontId
  radius: RadiusSize
  density: DensityMode
  accentHex: string // '' = use theme default
}

export const DEFAULT_PREFS: UserThemePrefs = {
  theme: 'light',
  font: 'prompt',
  radius: 'lg',
  density: 'comfortable',
  accentHex: '',
}

export const THEME_STORAGE_KEY = 'meridian_theme_prefs'

// ── Theme Metadata ────────────────────────────────────────────────

export interface ThemeMeta {
  id: ThemeId
  name: string
  nameEn: string
  emoji: string
  desc: string
  isDark: boolean
  palette: {
    bg: string
    sidebar: string
    accent: string
    card: string
    text: string
  }
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'light',
    name: 'Light',
    nameEn: 'Light',
    emoji: '☀️',
    desc: 'Notion-style อบอุ่น สะอาด',
    isDark: false,
    palette: { bg: '#FAFAF9', sidebar: '#F7F6F3', accent: '#2383E2', card: '#FFFFFF', text: '#37352F' },
  },
  {
    id: 'dark',
    name: 'Dark',
    nameEn: 'Dark',
    emoji: '🌙',
    desc: 'มืดสบายตา ไม่ล้า',
    isDark: true,
    palette: { bg: '#191919', sidebar: '#111111', accent: '#529DCA', card: '#252525', text: '#FFFFFF' },
  },
  {
    id: 'night',
    name: 'Night',
    nameEn: 'Night',
    emoji: '🌌',
    desc: 'ดำลึก ultra dark',
    isDark: true,
    palette: { bg: '#0A0A0A', sidebar: '#080808', accent: '#3D9EDF', card: '#141414', text: '#EBEBEB' },
  },
]

// ── Font Options ──────────────────────────────────────────────────

export const FONT_OPTIONS: { id: FontId; name: string; sample: string; css: string }[] = [
  { id: 'prompt', name: 'Prompt', sample: 'สวยงาม Modern', css: "'Prompt', sans-serif" },
  { id: 'inter',  name: 'Inter',  sample: 'Clean Minimal', css: "'Inter', sans-serif" },
  { id: 'kanit',  name: 'Kanit',  sample: 'ไทยอ่านง่าย', css: "'Kanit', sans-serif" },
]

// ── Radius Options ────────────────────────────────────────────────

export const RADIUS_OPTIONS: { id: RadiusSize; name: string; px: string }[] = [
  { id: 'none', name: 'Sharp',   px: '0px'  },
  { id: 'sm',   name: 'Small',   px: '6px'  },
  { id: 'md',   name: 'Medium',  px: '10px' },
  { id: 'lg',   name: 'Large',   px: '14px' },
  { id: 'xl',   name: 'Rounded', px: '20px' },
]

// ── Density Options ───────────────────────────────────────────────

export const DENSITY_OPTIONS: { id: DensityMode; name: string; desc: string; icon: string }[] = [
  { id: 'compact',     name: 'Compact',     desc: 'ข้อมูลเยอะ พื้นที่แน่น',  icon: '▤' },
  { id: 'comfortable', name: 'Comfortable', desc: 'สมดุล (แนะนำ)',           icon: '▥' },
  { id: 'spacious',    name: 'Spacious',    desc: 'โล่ง หายใจได้',           icon: '▦' },
]

// ── Accent Color Presets ──────────────────────────────────────────

export const ACCENT_PRESETS = [
  { name: 'Gold',     hex: '#C6A969' },
  { name: 'Blue',     hex: '#2563EB' },
  { name: 'Cyan',     hex: '#00E5FF' },
  { name: 'Purple',   hex: '#A855F7' },
  { name: 'Green',    hex: '#00A86B' },
  { name: 'Orange',   hex: '#F59E0B' },
  { name: 'Rose',     hex: '#F43F5E' },
  { name: 'Slate',    hex: '#475569' },
]

// ── Helpers ───────────────────────────────────────────────────────

export function hexToRgbSpace(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `${r} ${g} ${b}`
}

export function getTheme(id: ThemeId): ThemeMeta {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}
