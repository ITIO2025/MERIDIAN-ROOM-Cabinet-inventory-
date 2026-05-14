// ══════════════════════════════════════════════════════════════════
//  MERIDIAN ROOM — Theme Engine  v1.0
//  Design Token + Theme Preset System
// ══════════════════════════════════════════════════════════════════

export type ThemeId =
  | 'light'
  | 'dark'
  | 'midnight'
  | 'construction'
  | 'luxury'
  | 'minimal'
  | 'glass'
  | 'corporate'
  | 'ai'

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
    desc: 'สว่างสะอาด คลาสสิก',
    isDark: false,
    palette: { bg: '#F7F7F7', sidebar: '#111111', accent: '#C6A969', card: '#FFFFFF', text: '#111111' },
  },
  {
    id: 'dark',
    name: 'Dark',
    nameEn: 'Dark',
    emoji: '🌙',
    desc: 'มืดสบายตา ไม่ล้า',
    isDark: true,
    palette: { bg: '#0F0F0F', sidebar: '#0A0A0A', accent: '#C6A969', card: '#1E1E1E', text: '#F5F5F5' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    nameEn: 'Midnight',
    emoji: '🌌',
    desc: 'น้ำเงินเข้มลึก ดูล้ำ',
    isDark: true,
    palette: { bg: '#0D1117', sidebar: '#090D13', accent: '#58A6FF', card: '#1C2128', text: '#E6EDF3' },
  },
  {
    id: 'construction',
    name: 'Construction',
    nameEn: 'Construction',
    emoji: '🏗️',
    desc: 'อบอุ่น เหมาะงานก่อสร้าง',
    isDark: false,
    palette: { bg: '#FDF6ED', sidebar: '#1A1208', accent: '#F59E0B', card: '#FFFFFF', text: '#1A1208' },
  },
  {
    id: 'luxury',
    name: 'Luxury',
    nameEn: 'Luxury',
    emoji: '✨',
    desc: 'ดำทองหรูหรา พรีเมียม',
    isDark: true,
    palette: { bg: '#0A0805', sidebar: '#050302', accent: '#D4AF37', card: '#1A1510', text: '#F5EDD8' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    nameEn: 'Minimal',
    emoji: '⬜',
    desc: 'ขาวสะอาด เน้นเนื้อหา',
    isDark: false,
    palette: { bg: '#FFFFFF', sidebar: '#18181B', accent: '#18181B', card: '#FAFAFA', text: '#09090B' },
  },
  {
    id: 'glass',
    name: 'Glassmorphism',
    nameEn: 'Glassmorphism',
    emoji: '💎',
    desc: 'ฟอสต์กลาส สวยล้ำ',
    isDark: true,
    palette: { bg: '#0F0C29', sidebar: '#0A0A28', accent: '#A855F7', card: 'rgba(255,255,255,0.07)', text: '#FFFFFF' },
  },
  {
    id: 'corporate',
    name: 'Corporate',
    nameEn: 'Corporate',
    emoji: '🏢',
    desc: 'น้ำเงินสเลท มืออาชีพ',
    isDark: false,
    palette: { bg: '#F1F5F9', sidebar: '#0F172A', accent: '#2563EB', card: '#FFFFFF', text: '#0F172A' },
  },
  {
    id: 'ai',
    name: 'AI Futuristic',
    nameEn: 'AI Futuristic',
    emoji: '🤖',
    desc: 'ไซเบอร์ ไซไฟ สีนีออน',
    isDark: true,
    palette: { bg: '#050A14', sidebar: '#020810', accent: '#00E5FF', card: '#0D1F3C', text: '#E0F2FE' },
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
