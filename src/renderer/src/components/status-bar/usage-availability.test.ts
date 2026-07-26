import { describe, expect, it, vi } from 'vitest'
import type {
  ProviderRateLimits,
  UsageRateLimitFailureKind
} from '../../../../shared/rate-limit-types'

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string) => fallback
}))

const { describeUsageFailure, isUnavailableInactiveUsage, usageFailureNeedsSignIn } =
  await import('./usage-availability')

function failed(failureKind?: UsageRateLimitFailureKind): ProviderRateLimits {
  return {
    provider: 'claude',
    session: null,
    weekly: null,
    updatedAt: 0,
    error: 'boom',
    status: 'error',
    usageMetadata: failureKind ? { failureKind } : undefined
  }
}

describe('isUnavailableInactiveUsage', () => {
  it('is false for a snapshot carrying a window', () => {
    const limits = failed('rate-limited')
    limits.session = { usedPercent: 5, windowMinutes: 300, resetsAt: null, resetDescription: null }
    expect(isUnavailableInactiveUsage(limits)).toBe(false)
  })

  it('is true for an error snapshot with no windows', () => {
    expect(isUnavailableInactiveUsage(failed('stale-token'))).toBe(true)
  })
})

describe('usageFailureNeedsSignIn', () => {
  // Why: the bug this guards. A throttled account has working credentials, so
  // prompting for a sign-in sends the user to fix something that is not broken,
  // and blocking the switch would lock them out of a usable account.
  it.each<UsageRateLimitFailureKind>(['rate-limited', 'network', 'server', 'parse'])(
    'does not ask for a sign-in on a %s failure',
    (kind) => {
      expect(usageFailureNeedsSignIn(failed(kind))).toBe(false)
    }
  )

  it.each<UsageRateLimitFailureKind>(['missing-credentials', 'stale-token', 'missing-scope'])(
    'asks for a sign-in on a %s failure',
    (kind) => {
      expect(usageFailureNeedsSignIn(failed(kind))).toBe(true)
    }
  )

  // Why: an unclassified failure predates the classification, so fail closed
  // toward the actionable prompt rather than silently offering nothing.
  it('asks for a sign-in when the failure is unclassified', () => {
    expect(usageFailureNeedsSignIn(failed())).toBe(true)
  })
})

describe('describeUsageFailure', () => {
  it('names throttling instead of asking for a sign-in', () => {
    expect(describeUsageFailure(failed('rate-limited'))).toBe('Rate limited, retrying')
  })

  it('falls back to the sign-in prompt for an auth failure', () => {
    expect(describeUsageFailure(failed('stale-token'))).toBe('Sign in to see usage')
  })
})
