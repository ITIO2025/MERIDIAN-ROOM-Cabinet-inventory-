import type { BoardType, SurfaceType, EdgeType, HardwareBrand, InstallationType, ProjectType } from './types'

// ─── Board Prices (THB/แผ่น 1220×2440mm) ──────────────────────────────────────

export const BOARD_PRICES: Record<BoardType, Partial<Record<number, number>>> = {
  MDF:        { 9: 185, 12: 250, 18: 330 },
  HMR:        { 9: 270, 12: 390, 18: 530 },
  PLYWOOD:    { 9: 390, 12: 530, 18: 730 },
  PARTICLE:   { 9: 165, 12: 210, 18: 255 },
  BLOCKBOARD: { 18: 660, 25: 840 },
  SOLID_WOOD: { 18: 1250, 25: 1650 },
}

export function getBoardPrice(type: BoardType, thickness: number): number {
  return BOARD_PRICES[type]?.[thickness] ?? BOARD_PRICES[type]?.[18] ?? 350
}

// ─── Surface Finish Prices (THB/sqm เพิ่มเติมจากเมลามีน) ──────────────────────

export const SURFACE_PRICES: Record<SurfaceType, number> = {
  MELAMINE:  0,
  LAMINATE:  290,
  ACRYLIC:   870,
  VENEER:    1450,
  HIGLOSS:   640,
  PU_PAINT:  1850,
  VACUUM:    460,
}

// ─── Edge Banding (THB/เมตร) ──────────────────────────────────────────────────

export const EDGE_PRICES: Record<EdgeType, number> = {
  MELAMINE: 8,
  PVC_1MM: 12,
  PVC_2MM: 18,
  ABS: 24,
}

// ─── Hardware Prices (THB/ชิ้น or ชุด) ───────────────────────────────────────

export interface HardwarePriceSet {
  hinge: number
  slideFull400: number
  slideFull500: number
  softCloseAddon: number
  pushOpen: number
  liftSystem: number
  handle: number
}

export const HARDWARE_PRICES: Record<HardwareBrand, HardwarePriceSet> = {
  STANDARD: { hinge: 38, slideFull400: 280, slideFull500: 340, softCloseAddon: 85, pushOpen: 110, liftSystem: 1650, handle: 180 },
  HAFELE:   { hinge: 95, slideFull400: 480, slideFull500: 560, softCloseAddon: 140, pushOpen: 220, liftSystem: 2800, handle: 380 },
  BLUM:     { hinge: 145, slideFull400: 680, slideFull500: 780, softCloseAddon: 0,   pushOpen: 290, liftSystem: 4200, handle: 480 },
  HETTICH:  { hinge: 110, slideFull400: 560, slideFull500: 640, softCloseAddon: 120, pushOpen: 250, liftSystem: 3400, handle: 420 },
  FGV:      { hinge: 72, slideFull400: 380, slideFull500: 430, softCloseAddon: 90,  pushOpen: 160, liftSystem: 2100, handle: 280 },
  KING:     { hinge: 55, slideFull400: 320, slideFull500: 370, softCloseAddon: 80,  pushOpen: 140, liftSystem: 1900, handle: 230 },
}

// Blum hinges already include soft close
export function getHingePrice(brand: HardwareBrand, withSoftClose: boolean): number {
  const prices = HARDWARE_PRICES[brand]
  if (brand === 'BLUM') return prices.hinge
  return prices.hinge + (withSoftClose ? prices.softCloseAddon : 0)
}

// ─── LED Strip (THB/เมตร) ─────────────────────────────────────────────────────

export const LED_PRICE_PER_METER = 185

// ─── Hanging Rail (THB/เมตร) ─────────────────────────────────────────────────

export const HANGING_RAIL_PRICE_PER_METER = 95

// ─── Mirror (THB/sqm) ─────────────────────────────────────────────────────────

export const MIRROR_PRICE_PER_SQM = 850

// ─── Wire Basket (THB/ชุด) ────────────────────────────────────────────────────

export const BASKET_PRICE = 480

// ─── Sensor Light (THB/ชุด) ──────────────────────────────────────────────────

export const SENSOR_LIGHT_PRICE = 320

// ─── Lift System (THB/ชุด) ────────────────────────────────────────────────────

// Already in HARDWARE_PRICES.liftSystem

// ─── Labor Rates (THB) ───────────────────────────────────────────────────────

export const LABOR_RATES = {
  cuttingPerSheet: 85,
  edgeBandingPerMeter: 15,
  assemblyPerCabinet: 380,
  cncPerSheet: 190,
  drillingPerPiece: 28,
  paintingPerSqm: 380,
  vacuumPerSqm: 280,
  packagingPerCabinet: 150,
  qcPerCabinet: 120,
}

// ─── Installation Rates (THB/sqm) ────────────────────────────────────────────

export const INSTALLATION_RATES: Record<InstallationType, number> = {
  HOUSE:      280,
  CONDO:      340,
  OFFICE:     320,
  SHOPHOUSE:  300,
}

export const INSTALLATION_EXTRAS = {
  liftSurcharge: 110,     // per sqm when has lift access
  nightWorkSurcharge: 85, // per sqm
  siteRestriction: 1500,  // flat fee
  baseTransport: 1500,
  perKm: 18,
}

// ─── Overhead Factor ──────────────────────────────────────────────────────────

export const OVERHEAD_FACTOR = 0.14  // 14% of direct cost

// ─── Default Markup by Project Type ──────────────────────────────────────────

export const DEFAULT_MARKUP: Record<ProjectType, number> = {
  WARDROBE:         0.35,
  WALK_IN:          0.40,
  TV_CABINET:       0.38,
  KITCHEN:          0.42,
  PANTRY:           0.35,
  VANITY:           0.38,
  COUNTER:          0.35,
  SHOE_CABINET:     0.33,
  DISPLAY_CABINET:  0.40,
  FLOATING_CABINET: 0.38,
  FULL_HEIGHT:      0.40,
  OFFICE:           0.36,
  LUXURY:           0.50,
}

// ─── Sheet Size ───────────────────────────────────────────────────────────────

export const SHEET_WIDTH  = 1220  // mm
export const SHEET_HEIGHT = 2440  // mm
export const SHEET_AREA   = (SHEET_WIDTH * SHEET_HEIGHT) / 1_000_000  // sqm = 2.9768

// ─── Waste Factors ────────────────────────────────────────────────────────────

export const WASTE_FACTORS = {
  MDF:        0.15,
  HMR:        0.15,
  PLYWOOD:    0.18,
  PARTICLE:   0.14,
  BLOCKBOARD: 0.16,
  SOLID_WOOD: 0.22,
}

// ─── Price Override Helpers (reads localStorage on client) ────────────────────

function getOverrides(): Record<string, Record<string, number>> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem('price_overrides')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function getSurfacePrice(type: SurfaceType): number {
  const ov = getOverrides()
  if (ov.surface?.[type] !== undefined) return ov.surface[type]
  return SURFACE_PRICES[type]
}

export function getEdgePrice(type: EdgeType): number {
  const ov = getOverrides()
  if (ov.edge?.[type] !== undefined) return ov.edge[type]
  return EDGE_PRICES[type]
}

export function getLaborRate(key: keyof typeof LABOR_RATES): number {
  const ov = getOverrides()
  if (ov.labor?.[key] !== undefined) return ov.labor[key]
  return LABOR_RATES[key]
}

export function getInstallRate(type: InstallationType): number {
  const ov = getOverrides()
  if (ov.install?.[type] !== undefined) return ov.install[type]
  return INSTALLATION_RATES[type]
}

export function savePriceOverrides(
  category: 'surface' | 'edge' | 'labor' | 'install' | 'board',
  key: string,
  value: number
): void {
  if (typeof window === 'undefined') return
  const ov = getOverrides()
  if (!ov[category]) ov[category] = {}
  ov[category][key] = value
  localStorage.setItem('price_overrides', JSON.stringify(ov))
}

export function resetPriceOverrides(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('price_overrides')
}

// ─── Province List ────────────────────────────────────────────────────────────

export const PROVINCES = [
  'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร',
  'นครปฐม', 'ราชบุรี', 'เพชรบุรี', 'ชลบุรี', 'ระยอง',
  'ฉะเชิงเทรา', 'อยุธยา', 'ลพบุรี', 'สระบุรี', 'นครราชสีมา',
  'ขอนแก่น', 'อุดรธานี', 'เชียงใหม่', 'เชียงราย', 'ภูเก็ต',
  'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'สงขลา', 'หาดใหญ่', 'อื่นๆ',
]
