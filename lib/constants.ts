// ─── Shared Business Constants ────────────────────────────────────────────────

/**
 * Margin thresholds used across analytics, dashboard, and pricing pages.
 * Single source of truth — import from here instead of hardcoding per file.
 */
export const MARGIN_THRESHOLDS = {
  /** ≥ this → healthy (green) */
  GOOD:  35,
  /** ≥ this → acceptable (yellow/warning) */
  FAIR:  20,
  /** < FAIR → danger (red) */
} as const

/** Returns a Tailwind color class based on margin value */
export function marginColorClass(margin: number): string {
  if (margin >= MARGIN_THRESHOLDS.GOOD) return 'text-success'
  if (margin >= MARGIN_THRESHOLDS.FAIR) return 'text-warning'
  return 'text-danger'
}

/** Returns a CSS color string (for inline styles) based on margin value */
export function marginColor(margin: number): string {
  if (margin >= MARGIN_THRESHOLDS.GOOD) return 'var(--color-success)'
  if (margin >= MARGIN_THRESHOLDS.FAIR) return 'var(--color-warning)'
  return 'var(--color-danger)'
}
