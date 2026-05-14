import type {
  CabinetInput, PricingResult, Panel, BOQItem, CostBreakdown, BoardType,
} from './types'
import {
  getBoardPrice, SURFACE_PRICES, EDGE_PRICES, HARDWARE_PRICES, getHingePrice,
  LED_PRICE_PER_METER, HANGING_RAIL_PRICE_PER_METER, MIRROR_PRICE_PER_SQM,
  BASKET_PRICE, SENSOR_LIGHT_PRICE, LABOR_RATES, INSTALLATION_RATES,
  INSTALLATION_EXTRAS, OVERHEAD_FACTOR, SHEET_AREA, WASTE_FACTORS,
  DEFAULT_MARKUP,
  getSurfacePrice, getEdgePrice, getLaborRate, getInstallRate,
} from './data'
import { analyzeProject } from './ai-analyzer'

// ─── Sheet Count Calculator ────────────────────────────────────────────────────

function sheetsNeeded(totalAreaSqm: number, wasteFactor: number): number {
  return Math.ceil((totalAreaSqm * (1 + wasteFactor)) / SHEET_AREA)
}

// ─── Panel Generator ──────────────────────────────────────────────────────────

function generatePanels(input: CabinetInput): Panel[] {
  const { boardType, boardThickness, backBoardType, backBoardThickness, surfaceType } = input

  // Convert input dimensions cm → mm (all panel geometry must be in mm
  // so that p.width * p.height / 1_000_000 gives correct sqm, and
  // edgeLen / 1000 gives correct meters)
  const W  = input.width  * 10   // e.g. 280 cm → 2800 mm
  const H  = input.height * 10   // e.g. 240 cm → 2400 mm
  const D  = input.depth  * 10   // e.g.  60 cm →  600 mm

  const t  = boardThickness      // already mm (9 / 12 / 18)
  const bt = backBoardThickness  // already mm (9 / 12)

  // Inner dimensions (all in mm)
  const innerW = W - t * 2
  const innerH = H - t * 2
  const innerD = D - bt

  const hasSurface = surfaceType !== 'MELAMINE'

  const panels: Panel[] = []
  const pId = (name: string, w: number, h: number, qty: number, bt: BoardType, thickness: number, edgeCount: number, edgeLen: number): Panel => ({
    name, width: w, height: h, quantity: qty,
    boardType: bt, thickness, hasSurface, edgeCount,
    edgeLength: edgeLen / 1000, // convert mm to meters
  })

  // Top panel
  panels.push(pId('แผ่นบนสุด', W, D - bt, 1, boardType, t, 3, W * 2 + (D - bt) * 2))
  // Bottom panel
  panels.push(pId('แผ่นล่างสุด', W, D - bt, 1, boardType, t, 3, W * 2 + (D - bt) * 2))
  // Left side
  panels.push(pId('แผ่นข้างซ้าย', H - t * 2, D - bt, 1, boardType, t, 3, (H - t * 2) * 2 + (D - bt) * 2))
  // Right side
  panels.push(pId('แผ่นข้างขวา', H - t * 2, D - bt, 1, boardType, t, 3, (H - t * 2) * 2 + (D - bt) * 2))
  // Back panel (thinner)
  panels.push(pId('แผ่นหลัง', H, W, 1, backBoardType, bt, 0, 0))

  // Shelves
  if (input.shelfCount > 0) {
    panels.push(pId(
      `ชั้นวางของ (${input.shelfCount} ชั้น)`,
      innerW - t, innerD, input.shelfCount,
      boardType, t, 3, ((innerW - t) * 2 + innerD * 2) * input.shelfCount
    ))
  }

  // Drawers (front + back + 2 sides + bottom per drawer)
  if (input.drawerCount > 0) {
    const drawerH = Math.min(180, innerH / (input.drawerCount + input.shelfCount + 1))
    const drawerFront = (innerW - t)
    // Drawer front panel
    panels.push(pId(
      `หน้าลิ้นชัก (${input.drawerCount} ใบ)`,
      drawerFront, drawerH, input.drawerCount,
      boardType, t, 4, (drawerFront * 2 + drawerH * 2) * input.drawerCount
    ))
    // Drawer box (front+back 2 pcs, sides 2 pcs, bottom 1 pc)
    const drawerSideH = drawerH - 20
    panels.push(pId(`กล่องลิ้นชัก front/back (${input.drawerCount} ใบ)`, innerW - 30, drawerSideH, input.drawerCount * 2, boardType, t, 2, (innerW - 30) * 2 * input.drawerCount * 2))
    panels.push(pId(`กล่องลิ้นชัก ข้าง (${input.drawerCount} ใบ)`, innerD - 60, drawerSideH, input.drawerCount * 2, boardType, t, 2, (innerD - 60) * 2 * input.drawerCount * 2))
    panels.push(pId(`ก้นลิ้นชัก (${input.drawerCount} ใบ)`, innerW - 30, innerD - 60, input.drawerCount, backBoardType, bt, 0, 0))
  }

  // Doors
  if (input.doorType !== 'OPEN_SHELF' && input.doorCount > 0) {
    const doorW = Math.floor(innerW / input.doorCount) - 4
    const doorH = innerH - 4
    panels.push(pId(
      `บานประตู (${input.doorCount} บาน)`,
      doorW, doorH, input.doorCount,
      boardType, t, 4, (doorW * 2 + doorH * 2) * input.doorCount
    ))
  }

  // Mirror (if applicable)
  if (input.hasMirror) {
    panels.push(pId('แผ่นกระจก', innerW - t, innerH - t, 1, 'MDF', 0, 0, 0))
  }

  return panels
}

// ─── BOQ Builder ──────────────────────────────────────────────────────────────

function buildBOQ(
  input: CabinetInput,
  panels: Panel[],
  costs: CostBreakdown,
  totalBoardsMain: number,
  totalBoardsBack: number,
): BOQItem[] {
  const items: BOQItem[] = []
  let seq = 1

  const add = (
    category: BOQItem['category'],
    description: string,
    unit: string,
    qty: number,
    unitPrice: number,
    spec?: string,
    note?: string
  ): void => {
    items.push({
      id: `BOQ-${String(seq).padStart(3, '0')}`,
      seq: seq++,
      category,
      description,
      spec,
      unit,
      quantity: Math.round(qty * 100) / 100,
      unitPrice: Math.round(unitPrice),
      totalPrice: Math.round(qty * unitPrice),
      note,
    })
  }

  const { boardType, boardThickness, backBoardType, backBoardThickness, surfaceType, edgeType } = input
  const boardPriceMain = getBoardPrice(boardType, boardThickness)
  const boardPriceBack = getBoardPrice(backBoardType, backBoardThickness)
  const surfacePrice = getSurfacePrice(surfaceType)
  const edgePrice = getEdgePrice(edgeType)
  const hardware = HARDWARE_PRICES[input.hardwareBrand]
  const installRate = getInstallRate(input.installationType)

  // ─── Materials ───
  add('MATERIAL', `ไม้แผ่นหลัก ${boardType} ${boardThickness}mm`, 'แผ่น', totalBoardsMain, boardPriceMain,
    `1220×2440×${boardThickness}mm`, `จำนวนรวมทุกชุด ${input.quantity} ชุด`)
  add('MATERIAL', `ไม้แผ่นหลัง ${backBoardType} ${backBoardThickness}mm`, 'แผ่น', totalBoardsBack, boardPriceBack,
    `1220×2440×${backBoardThickness}mm`)

  // ─── Surface ───
  if (surfacePrice > 0) {
    const surfaceArea = panels.filter(p => p.hasSurface).reduce((s, p) => s + (p.width * p.height / 1_000_000) * p.quantity, 0) * input.quantity
    add('SURFACE', `Surface Finish ${surfaceType}`, 'sqm', surfaceArea * 2, surfacePrice, surfaceType)
  }

  // ─── Edge Banding ───
  const totalEdgeLength = panels.reduce((s, p) => s + p.edgeLength * p.quantity, 0) * input.quantity
  if (totalEdgeLength > 0) {
    add('EDGE', `Edge Banding ${edgeType}`, 'ม.', totalEdgeLength, edgePrice, edgeType)
  }

  // ─── Hardware ───
  const hingesPerDoor = 3
  const totalHinges = input.doorType === 'SWING' || input.doorType === 'GLASS_SWING'
    ? input.doorCount * hingesPerDoor * input.quantity : 0
  if (totalHinges > 0) {
    const hingeP = getHingePrice(input.hardwareBrand, input.hasSoftClose)
    add('HARDWARE', `บานพับ ${input.hardwareBrand}${input.hasSoftClose ? ' + Soft Close' : ''}`,
      'ตัว', totalHinges, hingeP, input.hardwareBrand)
  }

  if (input.doorType === 'SLIDING' || input.doorType === 'GLASS_SLIDING') {
    add('HARDWARE', `รางบานเลื่อน ${input.hardwareBrand}`, 'ชุด', input.quantity, hardware.slideFull500 * 2, input.hardwareBrand)
  }

  if (input.drawerCount > 0) {
    const totalDrawers = input.drawerCount * input.quantity
    const slidePrice = input.depth <= 450 ? hardware.slideFull400 : hardware.slideFull500
    add('HARDWARE', `ลูกล้อลิ้นชัก ${input.hardwareBrand}`, 'ชุด', totalDrawers, slidePrice, input.hardwareBrand)
    if (input.hasSoftClose && input.hardwareBrand !== 'BLUM') {
      add('HARDWARE', 'Soft Close ลิ้นชัก', 'ชุด', totalDrawers, hardware.softCloseAddon)
    }
  }

  if (input.hasPushOpen && (input.doorType === 'SWING' || input.doorType === 'PUSH_OPEN')) {
    add('HARDWARE', 'Push Open Mechanism', 'ชุด', input.doorCount * input.quantity, hardware.pushOpen)
  }

  if (input.hasLiftSystem) {
    add('HARDWARE', `Lift Up System ${input.hardwareBrand}`, 'ชุด', input.quantity, hardware.liftSystem)
  }

  if (input.hasSensorLight) {
    add('HARDWARE', 'Sensor Light', 'ชุด', input.quantity, SENSOR_LIGHT_PRICE)
  }

  // ─── Accessories ───
  if (input.hasLED) {
    add('HARDWARE', 'LED Strip Light', 'ม.', input.ledLength, LED_PRICE_PER_METER, '12V Warm White')
  }

  if (input.hasHangingRail) {
    add('HARDWARE', 'Hanging Rail + Bracket', 'ม.', input.hangingRailLength, HANGING_RAIL_PRICE_PER_METER)
  }

  if (input.hasMirror) {
    const mirrorArea = ((input.width - 60) * (input.height - 60)) / 10_000 * input.quantity  // cm² → m²
    add('HARDWARE', 'กระจกเงา', 'sqm', mirrorArea, MIRROR_PRICE_PER_SQM, '5mm Safety Mirror')
  }

  if (input.hasBasket) {
    add('HARDWARE', 'ตะกร้าลวด Wire Basket', 'ชุด', input.basketCount * input.quantity, BASKET_PRICE)
  }

  // ─── Handle cost ───
  if (input.handleType && input.handleType !== 'NONE' && input.handleType !== 'INTEGRATED' && input.handleType !== 'RECESSED') {
    const handleQty = (input.doorCount + input.drawerCount) * input.quantity
    if (handleQty > 0) {
      const handleUnitPrice = hardware.handle
      add('HARDWARE', `มือจับ (${input.handleType === 'BAR' ? 'แบบบาร์' : 'แบบปุ่ม'})`, 'ชิ้น', handleQty, handleUnitPrice,
        input.hardwareBrand)
    }
  }

  // ─── Custom Options (@options) ───
  if (input.customOptions && input.customOptions.length > 0) {
    for (const opt of input.customOptions) {
      if (opt.name && opt.price > 0 && opt.qty > 0) {
        add('HARDWARE', `@ ${opt.name}`, 'ชุด', opt.qty, opt.price)
      }
    }
  }

  // ─── Labor ───
  const totalSheets = totalBoardsMain + totalBoardsBack
  add('LABOR', 'ค่าแรงตัดไม้ (Cutting)', 'แผ่น', totalSheets, getLaborRate('cuttingPerSheet'))
  add('LABOR', 'ค่าแรง Edge Banding', 'ม.', totalEdgeLength, getLaborRate('edgeBandingPerMeter'))
  add('LABOR', 'ค่าแรงประกอบตู้ (Assembly)', 'ชุด', input.quantity, getLaborRate('assemblyPerCabinet'))
  add('LABOR', 'ค่า QC + บรรจุภัณฑ์', 'ชุด', input.quantity, getLaborRate('qcPerCabinet') + getLaborRate('packagingPerCabinet'))

  if (surfaceType === 'PU_PAINT') {
    const paintArea = panels.reduce((s, p) => s + (p.width * p.height / 1_000_000) * p.quantity, 0) * input.quantity * 2
    add('LABOR', 'ค่าแรงทาสี PU Paint', 'sqm', paintArea, getLaborRate('paintingPerSqm'))
  }
  if (surfaceType === 'VACUUM') {
    const vacArea = panels.reduce((s, p) => s + (p.width * p.height / 1_000_000) * p.quantity, 0) * input.quantity * 2
    add('LABOR', 'ค่าแรง Vacuum Press', 'sqm', vacArea, getLaborRate('vacuumPerSqm'))
  }

  // ─── Installation ───
  const installArea = (input.width * input.height) / 10_000 * input.quantity  // cm² → m²
  add('INSTALLATION', 'ค่าแรงติดตั้งหน้างาน', 'sqm', installArea, installRate,
    input.installationType)

  if (input.hasLift) {
    add('INSTALLATION', 'ค่าขนขึ้น Lift/ลิฟต์', 'sqm', installArea, INSTALLATION_EXTRAS.liftSurcharge)
  }
  if (input.isNightWork) {
    add('INSTALLATION', 'ค่าทำงานกลางคืน (OT)', 'sqm', installArea, INSTALLATION_EXTRAS.nightWorkSurcharge)
  }
  if (input.hasSiteRestriction) {
    add('INSTALLATION', 'ค่าข้อจำกัดหน้างาน', 'ครั้ง', 1, INSTALLATION_EXTRAS.siteRestriction)
  }

  // ─── Overhead / Transport ───
  const transport = INSTALLATION_EXTRAS.baseTransport + (input.distanceKm * INSTALLATION_EXTRAS.perKm)
  add('OVERHEAD', 'ค่าขนส่ง + เชื้อเพลิง', 'เที่ยว', 1, transport,
    `ระยะทาง ${input.distanceKm} กม.`)

  return items
}

// ─── Main Calculate Function ───────────────────────────────────────────────────

export function calculatePricing(input: CabinetInput): PricingResult {
  const panels = generatePanels(input)

  // ─── Board Counts ───
  // Separate by BOTH boardType AND thickness to avoid merging back panels with main panels
  // when boardType === backBoardType (e.g. both MDF) but thicknesses differ (18mm vs 9mm)
  const mainPanels = panels.filter(p =>
    p.boardType === input.boardType && p.thickness === input.boardThickness
  )
  const backPanels = panels.filter(p =>
    p.boardType === input.backBoardType && p.thickness === input.backBoardThickness &&
    !(p.boardType === input.boardType && p.thickness === input.boardThickness)
  )
  const otherPanels = panels.filter(p =>
    !(p.boardType === input.boardType && p.thickness === input.boardThickness) &&
    !(p.boardType === input.backBoardType && p.thickness === input.backBoardThickness)
  )

  const mainAreaSqm = mainPanels.reduce((s, p) => s + (p.width * p.height / 1_000_000) * p.quantity, 0) * input.quantity
  const backAreaSqm = backPanels.concat(otherPanels).reduce((s, p) => s + (p.width * p.height / 1_000_000) * p.quantity, 0) * input.quantity
  const totalAreaSqm = panels.reduce((s, p) => s + (p.width * p.height / 1_000_000) * p.quantity, 0) * input.quantity

  const wasteFactor = WASTE_FACTORS[input.boardType] ?? 0.15
  const totalBoardsMain = sheetsNeeded(mainAreaSqm, wasteFactor)
  const totalBoardsBack = sheetsNeeded(backAreaSqm, WASTE_FACTORS[input.backBoardType] ?? 0.15)
  const totalSheetsUsed = totalBoardsMain + totalBoardsBack

  const rawSheets = (mainAreaSqm + backAreaSqm) / SHEET_AREA
  const wastePercent = rawSheets > 0 ? ((totalSheetsUsed - rawSheets) / totalSheetsUsed) * 100 : 0

  // ─── Cost Calculations ───
  const boardPriceMain = getBoardPrice(input.boardType, input.boardThickness)
  const boardPriceBack = getBoardPrice(input.backBoardType, input.backBoardThickness)
  const boardMaterial = totalBoardsMain * boardPriceMain + totalBoardsBack * boardPriceBack

  const surfaceFactor = getSurfacePrice(input.surfaceType)
  const surfaceArea = totalAreaSqm * 2  // both sides
  const surfaceFinish = surfaceFactor * surfaceArea

  const totalEdgeLength = panels.reduce((s, p) => s + p.edgeLength * p.quantity, 0) * input.quantity
  const edgebanding = totalEdgeLength * getEdgePrice(input.edgeType)

  // Hardware costs
  const hwPrices = HARDWARE_PRICES[input.hardwareBrand]
  let hardware = 0
  if (input.doorType === 'SWING' || input.doorType === 'GLASS_SWING') {
    hardware += getHingePrice(input.hardwareBrand, input.hasSoftClose) * input.doorCount * 3 * input.quantity
  }
  if (input.doorType === 'SLIDING' || input.doorType === 'GLASS_SLIDING') {
    hardware += hwPrices.slideFull500 * 2 * input.quantity
  }
  if (input.drawerCount > 0) {
    const slideP = input.depth <= 450 ? hwPrices.slideFull400 : hwPrices.slideFull500
    hardware += (slideP + (input.hasSoftClose && input.hardwareBrand !== 'BLUM' ? hwPrices.softCloseAddon : 0)) * input.drawerCount * input.quantity
  }
  if (input.hasPushOpen) hardware += hwPrices.pushOpen * input.doorCount * input.quantity
  if (input.hasLiftSystem) hardware += hwPrices.liftSystem * input.quantity
  if (input.hasSensorLight) hardware += SENSOR_LIGHT_PRICE * input.quantity
  if (input.hasLED) hardware += LED_PRICE_PER_METER * input.ledLength
  if (input.hasHangingRail) hardware += HANGING_RAIL_PRICE_PER_METER * input.hangingRailLength
  if (input.hasMirror) hardware += MIRROR_PRICE_PER_SQM * ((input.width - 60) * (input.height - 60) / 10_000) * input.quantity  // cm² → m²
  if (input.hasBasket) hardware += BASKET_PRICE * input.basketCount * input.quantity
  // Handle cost
  if (input.handleType && input.handleType !== 'NONE' && input.handleType !== 'INTEGRATED' && input.handleType !== 'RECESSED') {
    const handleQty = (input.doorCount + input.drawerCount) * input.quantity
    if (handleQty > 0) hardware += hwPrices.handle * handleQty
  }
  // Custom options cost
  const customOptionsCost = (input.customOptions ?? []).reduce((s, o) => s + o.price * o.qty, 0)

  // Labor
  let laborFactory = getLaborRate('cuttingPerSheet') * totalSheetsUsed
  laborFactory += getLaborRate('edgeBandingPerMeter') * totalEdgeLength
  laborFactory += getLaborRate('assemblyPerCabinet') * input.quantity
  laborFactory += (getLaborRate('qcPerCabinet') + getLaborRate('packagingPerCabinet')) * input.quantity
  if (input.surfaceType === 'PU_PAINT') laborFactory += getLaborRate('paintingPerSqm') * surfaceArea
  if (input.surfaceType === 'VACUUM') laborFactory += getLaborRate('vacuumPerSqm') * surfaceArea

  // Installation
  const installArea = (input.width * input.height) / 10_000 * input.quantity  // cm² → m²
  let laborInstallation = getInstallRate(input.installationType) * installArea
  if (input.hasLift) laborInstallation += INSTALLATION_EXTRAS.liftSurcharge * installArea
  if (input.isNightWork) laborInstallation += INSTALLATION_EXTRAS.nightWorkSurcharge * installArea
  if (input.hasSiteRestriction) laborInstallation += INSTALLATION_EXTRAS.siteRestriction
  const transport = INSTALLATION_EXTRAS.baseTransport + input.distanceKm * INSTALLATION_EXTRAS.perKm

  const directCost = boardMaterial + surfaceFinish + edgebanding + hardware + customOptionsCost + laborFactory + laborInstallation + transport
  const overhead = directCost * OVERHEAD_FACTOR

  const netCost = directCost + overhead

  const costBreakdown: CostBreakdown = {
    boardMaterial,
    surfaceFinish,
    edgebanding,
    hardware,
    laborFactory,
    laborInstallation,
    overhead,
    transport,
  }

  // ─── Pricing ───
  // targetMargin is stored as decimal (0.35 = 35%) — do NOT divide by 100
  const targetMargin = input.targetMargin
  const sellingPriceBeforeDiscount = targetMargin >= 1 ? netCost * 2 : netCost / (1 - targetMargin)
  const discountAmount = sellingPriceBeforeDiscount * (input.discount / 100)
  const sellingPrice = sellingPriceBeforeDiscount - discountAmount
  const salesCommissionAmount = sellingPrice * (input.salesCommission / 100)
  const sellingAfterCommission = sellingPrice - salesCommissionAmount
  const vatAmount = input.includeVAT ? sellingPrice * 0.07 : 0
  const totalWithVAT = sellingPrice + vatAmount
  const grossProfit = sellingAfterCommission - netCost
  const grossMarginPercent = sellingAfterCommission > 0 ? (grossProfit / sellingAfterCommission) * 100 : 0
  const pricePerSqm = installArea > 0 ? sellingPrice / installArea : 0
  const pricePerUnit = input.quantity > 0 ? sellingPrice / input.quantity : 0

  const boqItems = buildBOQ(input, panels, costBreakdown, totalBoardsMain, totalBoardsBack)

  const aiAnalysis = analyzeProject({
    input,
    costBreakdown,
    netCost,
    sellingPrice,
    grossMarginPercent,
    wastePercent,
    totalSheetsUsed,
    hardware,
    laborFactory,
    boardMaterial,
    pricePerSqm,
  })

  return {
    input,
    panels,
    boqItems,
    costBreakdown,
    totalBoardsMain,
    totalBoardsBack,
    totalSheetsUsed,
    totalAreaSqm,
    wastePercent,
    netCost,
    salesCommissionAmount,
    sellingPriceBeforeDiscount,
    discountAmount,
    sellingPrice,
    vatAmount,
    totalWithVAT,
    grossProfit,
    grossMarginPercent,
    pricePerSqm,
    pricePerUnit,
    aiAnalysis,
    calculatedAt: new Date(),
  }
}

// ─── Format Currency ──────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  if (!value || isNaN(value)) return '฿0'
  return `฿${Math.round(value).toLocaleString('th-TH')}`
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value)
}
