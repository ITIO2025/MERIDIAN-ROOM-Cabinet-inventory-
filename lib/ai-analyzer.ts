import type { AIAnalysis, AIWarning, AISuggestion, CabinetInput, CostBreakdown } from './types'
import { BOARD_TYPE_LABELS, SURFACE_TYPE_LABELS } from './types'

interface AnalyzeInput {
  input: CabinetInput
  costBreakdown: CostBreakdown
  netCost: number
  sellingPrice: number
  grossMarginPercent: number
  wastePercent: number
  totalSheetsUsed: number
  hardware: number
  laborFactory: number
  boardMaterial: number
  pricePerSqm: number
}

export function analyzeProject(data: AnalyzeInput): AIAnalysis {
  const {
    input, costBreakdown, netCost, grossMarginPercent,
    wastePercent, hardware, boardMaterial, pricePerSqm,
  } = data

  const warnings: AIWarning[] = []
  const suggestions: AISuggestion[] = []
  let score = 100

  // ─── Margin Analysis ─────────────────────────────────────────────────────────

  let marginStatus: AIAnalysis['marginStatus'] = 'OK'
  if (grossMarginPercent < 0) {
    marginStatus = 'DANGER'
    score -= 40
    warnings.push({
      id: 'W001',
      level: 'DANGER',
      category: 'Margin',
      message: `งานนี้ขาดทุน! Margin ติดลบ ${Math.abs(grossMarginPercent).toFixed(1)}%`,
      value: `${grossMarginPercent.toFixed(1)}%`,
    })
  } else if (grossMarginPercent < 15) {
    marginStatus = 'DANGER'
    score -= 30
    warnings.push({
      id: 'W002',
      level: 'DANGER',
      category: 'Margin',
      message: `Margin ต่ำมาก ${grossMarginPercent.toFixed(1)}% — เป้าหมายขั้นต่ำควรอยู่ที่ 25%`,
      value: `${grossMarginPercent.toFixed(1)}%`,
    })
  } else if (grossMarginPercent < 25) {
    marginStatus = 'LOW'
    score -= 15
    warnings.push({
      id: 'W003',
      level: 'WARNING',
      category: 'Margin',
      message: `Margin ${grossMarginPercent.toFixed(1)}% ต่ำกว่าเป้าหมาย 25% อยู่ ${(25 - grossMarginPercent).toFixed(1)}%`,
      value: `${grossMarginPercent.toFixed(1)}%`,
    })
  } else if (grossMarginPercent < 35) {
    marginStatus = 'OK'
  } else if (grossMarginPercent < 45) {
    marginStatus = 'GOOD'
  } else {
    marginStatus = 'EXCELLENT'
  }

  // ─── Hardware Cost Analysis ───────────────────────────────────────────────────

  const hardwareRatio = netCost > 0 ? (hardware / netCost) * 100 : 0
  if (hardwareRatio > 30) {
    score -= 10
    warnings.push({
      id: 'W004',
      level: 'WARNING',
      category: 'Hardware',
      message: `ต้นทุน Hardware สูงถึง ${hardwareRatio.toFixed(1)}% ของงาน (เกินมาตรฐาน 25%)`,
      value: `${hardwareRatio.toFixed(1)}%`,
    })
    if (input.hardwareBrand === 'BLUM' || input.hardwareBrand === 'HAFELE') {
      suggestions.push({
        id: 'S001',
        type: 'HARDWARE',
        title: `เปลี่ยน ${input.hardwareBrand} → Hettich`,
        description: `Hettich มีคุณภาพใกล้เคียงและรับประกัน Lifetime แต่ราคาต่ำกว่า ${input.hardwareBrand} ประมาณ 25-30%`,
        impact: `ลดต้นทุน Hardware ได้ ~${Math.round(hardware * 0.27).toLocaleString('th-TH')} บาท`,
        potentialSaving: hardware * 0.27,
        confidence: 'HIGH',
      })
    }
  }

  // ─── Waste Analysis ───────────────────────────────────────────────────────────

  if (wastePercent > 25) {
    score -= 10
    warnings.push({
      id: 'W005',
      level: 'WARNING',
      category: 'Waste',
      message: `Waste สูงถึง ${wastePercent.toFixed(1)}% — แนะนำ Optimize การตัดไม้`,
      value: `${wastePercent.toFixed(1)}%`,
    })
    suggestions.push({
      id: 'S002',
      type: 'PROCESS',
      title: 'Optimize Sheet Cutting Pattern',
      description: 'วางแผนการตัดให้ชิ้นงานที่ขนาดใกล้กันอยู่ในแผ่นเดียวกัน ลด Waste ได้ 5-8%',
      impact: `ประหยัดไม้ได้ ~${Math.round(boardMaterial * 0.06).toLocaleString('th-TH')} บาท`,
      potentialSaving: boardMaterial * 0.06,
      confidence: 'MEDIUM',
    })
  }

  // ─── Material Upgrade/Downgrade Suggestions ────────────────────────────────

  if (input.boardType === 'HMR' && input.installationType === 'HOUSE') {
    suggestions.push({
      id: 'S003',
      type: 'MATERIAL',
      title: 'พิจารณาใช้ MDF แทน HMR (สำหรับพื้นที่แห้ง)',
      description: 'งาน House ในพื้นที่แห้ง MDF เพียงพอและประหยัดกว่า HMR 40%',
      impact: `ลดต้นทุนไม้ได้ ~${Math.round(boardMaterial * 0.28).toLocaleString('th-TH')} บาท`,
      potentialSaving: boardMaterial * 0.28,
      confidence: 'MEDIUM',
    })
  }

  if (input.boardType === 'MDF' && input.installationType === 'CONDO') {
    score -= 5
    warnings.push({
      id: 'W006',
      level: 'WARNING',
      category: 'Material',
      message: 'Condo ควรใช้ HMR (กันชื้น) แทน MDF ป้องกันปัญหาระยะยาว',
      value: 'MDF in Condo',
    })
    suggestions.push({
      id: 'S004',
      type: 'MATERIAL',
      title: 'Upgrade MDF → HMR สำหรับงาน Condo',
      description: 'Condo มีความชื้นสูงกว่า HMR จะป้องกันการบวมได้ดีกว่า และเพิ่มมูลค่างานในสายตาลูกค้า',
      impact: 'เพิ่มความน่าเชื่อถือ ลดปัญหา Warranty',
      potentialSaving: 0,
      confidence: 'HIGH',
    })
  }

  // ─── Surface Upsell ────────────────────────────────────────────────────────

  if (input.surfaceType === 'MELAMINE' && input.projectType !== 'OFFICE') {
    suggestions.push({
      id: 'S005',
      type: 'UPSELL',
      title: `Upsell: เสนอ Laminate HPL แทน Melamine`,
      description: 'ลูกค้า Premium ยินดีจ่ายเพิ่มเพื่อ Laminate HPL ที่ทนทานและสวยกว่า เพิ่มราคาได้ 12-18%',
      impact: 'เพิ่ม Revenue 12-18% โดยต้นทุนเพิ่มเพียง 8%',
      potentialSaving: -netCost * 0.1,  // negative = revenue increase
      confidence: 'MEDIUM',
    })
  }

  // ─── Price Per SQM Check ─────────────────────────────────────────────────

  const benchmarks: Partial<Record<string, { low: number; high: number }>> = {
    WARDROBE: { low: 8000, high: 18000 },
    KITCHEN: { low: 12000, high: 25000 },
    TV_CABINET: { low: 7000, high: 16000 },
    WALK_IN: { low: 10000, high: 22000 },
    LUXURY: { low: 20000, high: 50000 },
  }

  const bench = benchmarks[input.projectType]
  if (bench) {
    if (pricePerSqm < bench.low) {
      score -= 8
      warnings.push({
        id: 'W007',
        level: 'WARNING',
        category: 'Price Benchmark',
        message: `ราคา ${Math.round(pricePerSqm).toLocaleString('th-TH')} บาท/sqm ต่ำกว่า Market Rate (${bench.low.toLocaleString('th-TH')}–${bench.high.toLocaleString('th-TH')})`,
        value: `${Math.round(pricePerSqm).toLocaleString('th-TH')} บ./sqm`,
      })
    } else if (pricePerSqm > bench.high * 1.2) {
      warnings.push({
        id: 'W008',
        level: 'INFO',
        category: 'Price Benchmark',
        message: `ราคา ${Math.round(pricePerSqm).toLocaleString('th-TH')} บาท/sqm สูงกว่า Market Rate — ตรวจสอบความเหมาะสม`,
        value: `${Math.round(pricePerSqm).toLocaleString('th-TH')} บ./sqm`,
      })
    }
  }

  // ─── Sales Commission ─────────────────────────────────────────────────────

  if (input.salesCommission > 10) {
    score -= 5
    warnings.push({
      id: 'W009',
      level: 'INFO',
      category: 'Commission',
      message: `Commission ${input.salesCommission}% สูง — อาจกระทบ Net Profit`,
      value: `${input.salesCommission}%`,
    })
  }

  // ─── Profitability Rating ─────────────────────────────────────────────────

  score = Math.max(0, Math.min(100, score))
  let profitabilityRating: string
  if (score >= 85) profitabilityRating = 'งานดีเยี่ยม'
  else if (score >= 70) profitabilityRating = 'งานดี'
  else if (score >= 55) profitabilityRating = 'งานพอใช้'
  else if (score >= 40) profitabilityRating = 'ต้องระวัง'
  else profitabilityRating = 'ความเสี่ยงสูง'

  const warnCount = warnings.filter(w => w.level !== 'INFO').length
  const summary = warnCount === 0
    ? `งานนี้มีกำไร ${grossMarginPercent.toFixed(1)}% อยู่ในเกณฑ์ดี ไม่พบความเสี่ยง`
    : `พบ ${warnCount} จุดที่ต้องแก้ไข — Margin ${grossMarginPercent.toFixed(1)}%, Score ${score}/100`

  return { score, marginStatus, profitabilityRating, warnings, suggestions, summary }
}
