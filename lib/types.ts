// ─── Project & Cabinet Types ─────────────────────────────────────────────────

export type ProjectType =
  | 'WARDROBE' | 'WALK_IN' | 'TV_CABINET' | 'KITCHEN'
  | 'PANTRY' | 'VANITY' | 'COUNTER' | 'SHOE_CABINET'
  | 'DISPLAY_CABINET' | 'FLOATING_CABINET' | 'FULL_HEIGHT'
  | 'OFFICE' | 'LUXURY'

export type BoardType = 'MDF' | 'HMR' | 'PLYWOOD' | 'PARTICLE' | 'BLOCKBOARD' | 'SOLID_WOOD'

export type SurfaceType =
  | 'MELAMINE' | 'LAMINATE' | 'ACRYLIC'
  | 'VENEER' | 'HIGLOSS' | 'PU_PAINT' | 'VACUUM'

export type EdgeType = 'MELAMINE' | 'PVC_1MM' | 'PVC_2MM' | 'ABS'

export type DoorType = 'SWING' | 'SLIDING' | 'PUSH_OPEN' | 'OPEN_SHELF' | 'GLASS_SWING' | 'GLASS_SLIDING'

export type HardwareBrand = 'STANDARD' | 'HAFELE' | 'BLUM' | 'HETTICH' | 'FGV' | 'KING'

export type HandleType = 'BAR' | 'KNOB' | 'RECESSED' | 'INTEGRATED' | 'NONE'

// ─── Custom Option (@ line items) ─────────────────────────────────────────────

export interface CustomOption {
  id: string
  name: string
  price: number
  qty: number
}

export type InstallationType = 'HOUSE' | 'CONDO' | 'OFFICE' | 'SHOPHOUSE'

export type ProjectStatus = 'QUOTE' | 'CONFIRMED' | 'PRODUCTION' | 'INSTALLATION' | 'COMPLETED' | 'CANCELLED'

export type MarginStatus = 'DANGER' | 'LOW' | 'OK' | 'GOOD' | 'EXCELLENT'

// ─── Cabinet Input ────────────────────────────────────────────────────────────

export interface CabinetInput {
  // Project Info
  projectName: string
  customerName: string
  designer: string
  sales: string
  projectType: ProjectType
  location: string
  province: string
  floorLevel: string

  // Dimensions
  width: number
  height: number
  depth: number
  quantity: number

  // Main Board
  boardType: BoardType
  boardThickness: 9 | 12 | 18
  surfaceType: SurfaceType
  color: string
  edgeType: EdgeType

  // Back Panel
  backBoardType: BoardType
  backBoardThickness: 9 | 12 | 18

  // Door System
  doorType: DoorType
  doorCount: number
  hasSoftClose: boolean
  hasPushOpen: boolean
  hasGlassDoor: boolean

  // Internal Components
  shelfCount: number
  drawerCount: number
  hasHangingRail: boolean
  hangingRailLength: number
  hasLED: boolean
  ledLength: number
  hasMirror: boolean
  hasBasket: boolean
  basketCount: number

  // Hardware
  hardwareBrand: HardwareBrand
  handleType: HandleType
  hasLiftSystem: boolean
  hasSensorLight: boolean

  // Custom Options (@option line items)
  customOptions: CustomOption[]

  // Installation
  installationType: InstallationType
  hasLift: boolean
  isNightWork: boolean
  hasSiteRestriction: boolean
  distanceKm: number

  // Pricing
  targetMargin: number
  discount: number
  includeVAT: boolean
  salesCommission: number
}

// ─── Panel / Piece ─────────────────────────────────────────────────────────────

export interface Panel {
  name: string
  width: number   // mm
  height: number  // mm
  quantity: number
  boardType: BoardType
  thickness: number
  hasSurface: boolean
  edgeCount: number  // how many edges get banded
  edgeLength: number // total edge length in meters
}

// ─── BOQ Item ─────────────────────────────────────────────────────────────────

export interface BOQItem {
  id: string
  seq: number
  category: 'MATERIAL' | 'SURFACE' | 'EDGE' | 'HARDWARE' | 'LABOR' | 'INSTALLATION' | 'OVERHEAD'
  description: string
  spec?: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  note?: string
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

export interface AIWarning {
  id: string
  level: 'INFO' | 'WARNING' | 'DANGER'
  category: string
  message: string
  value?: string
}

export interface AISuggestion {
  id: string
  type: 'MATERIAL' | 'HARDWARE' | 'PROCESS' | 'SALES' | 'UPSELL'
  title: string
  description: string
  impact: string
  potentialSaving: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface AIAnalysis {
  score: number
  marginStatus: MarginStatus
  profitabilityRating: string
  warnings: AIWarning[]
  suggestions: AISuggestion[]
  summary: string
}

// ─── Pricing Result ───────────────────────────────────────────────────────────

export interface CostBreakdown {
  boardMaterial: number
  surfaceFinish: number
  edgebanding: number
  hardware: number
  laborFactory: number
  laborInstallation: number
  overhead: number
  transport: number
}

export interface PricingResult {
  input: CabinetInput
  panels: Panel[]
  boqItems: BOQItem[]
  costBreakdown: CostBreakdown
  totalBoardsMain: number
  totalBoardsBack: number
  totalSheetsUsed: number
  totalAreaSqm: number
  wastePercent: number
  netCost: number
  salesCommissionAmount: number
  sellingPriceBeforeDiscount: number
  discountAmount: number
  sellingPrice: number
  vatAmount: number
  totalWithVAT: number
  grossProfit: number
  grossMarginPercent: number
  pricePerSqm: number
  pricePerUnit: number
  aiAnalysis: AIAnalysis
  calculatedAt: Date
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  customer: string
  designer: string
  sales: string
  type: ProjectType
  status: ProjectStatus
  sellingPrice: number
  netCost: number
  grossMarginPercent: number
  location: string
  createdAt: Date
  updatedAt: Date
  result?: PricingResult
}

// ─── Display Helpers ──────────────────────────────────────────────────────────

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  WARDROBE: 'ตู้เสื้อผ้า',
  WALK_IN: 'Walk-in Closet',
  TV_CABINET: 'ตู้ TV',
  KITCHEN: 'ครัว',
  PANTRY: 'แพนทรี่',
  VANITY: 'ตู้แต่งหน้า',
  COUNTER: 'เคาน์เตอร์',
  SHOE_CABINET: 'ตู้รองเท้า',
  DISPLAY_CABINET: 'ตู้โชว์',
  FLOATING_CABINET: 'ตู้ลอย',
  FULL_HEIGHT: 'ตู้เต็มความสูง',
  OFFICE: 'เฟอร์นิเจอร์สำนักงาน',
  LUXURY: 'งาน Luxury',
}

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  MDF: 'MDF',
  HMR: 'HMR (กันชื้น)',
  PLYWOOD: 'ไม้อัด',
  PARTICLE: 'Particle Board',
  BLOCKBOARD: 'Blockboard',
  SOLID_WOOD: 'ไม้แท้',
}

export const SURFACE_TYPE_LABELS: Record<SurfaceType, string> = {
  MELAMINE: 'เมลามีน',
  LAMINATE: 'ลามิเนต HPL',
  ACRYLIC: 'อะคริลิค',
  VENEER: 'วีเนียร์',
  HIGLOSS: 'Hi-Gloss',
  PU_PAINT: 'PU Paint',
  VACUUM: 'Vacuum Membrane',
}

export const HANDLE_TYPE_LABELS: Record<HandleType, string> = {
  BAR:        'บาร์แนวนอน',
  KNOB:       'ปุ่มกลม',
  RECESSED:   'เซาะร่อง (Groove)',
  INTEGRATED: 'บานผลัก Push-to-open',
  NONE:       'ไม่มีมือจับ',
}

export const DOOR_TYPE_LABELS: Record<DoorType, string> = {
  SWING: 'บานเปิด',
  SLIDING: 'บานเลื่อน',
  PUSH_OPEN: 'Push Open',
  OPEN_SHELF: 'ไม่มีบาน',
  GLASS_SWING: 'กระจกบานเปิด',
  GLASS_SLIDING: 'กระจกบานเลื่อน',
}

export const HARDWARE_BRAND_LABELS: Record<HardwareBrand, string> = {
  STANDARD: 'Standard',
  HAFELE: 'Häfele',
  BLUM: 'Blum',
  HETTICH: 'Hettich',
  FGV: 'FGV',
  KING: 'King',
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  QUOTE: 'ใบเสนอราคา',
  CONFIRMED: 'ยืนยันแล้ว',
  PRODUCTION: 'กำลังผลิต',
  INSTALLATION: 'กำลังติดตั้ง',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
}
