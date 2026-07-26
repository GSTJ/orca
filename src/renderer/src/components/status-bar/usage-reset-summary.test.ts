import { describe, expect, it, vi } from 'vitest'
import type { ProviderRateLimits } from '../../../../shared/rate-limit-types'

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string) => fallback
}))

const { formatUsageResetSummary } = await import('./usage-reset-summary')

function window(resetsAt: number | null, windowMinutes: number) {
  return { usedPercent: 10, windowMinutes, resetsAt, resetDescription: null }
}

function limits(overrides: Partial<ProviderRateLimits>): ProviderRateLimits {
  return {
    provider: 'claude',
    session: null,
    weekly: null,
    updatedAt: 0,
    error: null,
    status: 'ok',
    ...overrides
  }
}

// Fixed instants so the assertions read against a known wall clock.
const SESSION_RESET = new Date('2026-07-26T16:15:00Z').getTime()
const WEEKLY_RESET = new Date('2026-07-31T09:00:00Z').getTime()

describe('formatUsageResetSummary', () => {
  it('returns null without a snapshot', () => {
    expect(formatUsageResetSummary(null)).toBeNull()
  })

  // Why: a window with no reset timestamp must not render an empty "Resets" line.
  it('returns null when no window carries a reset time', () => {
    expect(formatUsageResetSummary(limits({ session: window(null, 300) }))).toBeNull()
  })

  it('names each window that has a reset time', () => {
    const summary = formatUsageResetSummary(
      limits({
        session: window(SESSION_RESET, 300),
        weekly: window(WEEKLY_RESET, 10080),
        fableWeekly: window(WEEKLY_RESET, 10080)
      })
    )

    expect(summary).toContain('Resets')
    expect(summary).toContain('session')
    expect(summary).toContain('weekly')
    expect(summary).toContain('Fable')
    // Both instants fall in July, so the month shows up regardless of timezone.
    expect(summary).toContain('Jul')
  })

  it('skips windows without a reset time', () => {
    const summary = formatUsageResetSummary(
      limits({ session: window(SESSION_RESET, 300), weekly: window(null, 10080) })
    )

    expect(summary).toContain('session')
    expect(summary).not.toContain('weekly')
  })
})
