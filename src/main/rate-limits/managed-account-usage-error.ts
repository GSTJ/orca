import type {
  ProviderRateLimits,
  UsageRateLimitFailureKind,
  UsageRateLimitMetadata
} from '../../shared/rate-limit-types'

/**
 * Failure kinds a later refetch can plausibly clear on its own.
 *
 * Auth failures are excluded: no amount of retrying fixes a credential the
 * user has to re-authorize.
 */
const RETRYABLE_FAILURE_KINDS = new Set<UsageRateLimitFailureKind>([
  'rate-limited',
  'network',
  'server',
  'parse'
])

/**
 * True when a snapshot carries at least one real usage window.
 *
 * Only such a snapshot is worth keeping over a fresh failure; a cached error
 * would otherwise shadow the current reason forever.
 */
export function hasUsableUsageWindow(
  limits: ProviderRateLimits | null | undefined
): limits is ProviderRateLimits {
  return Boolean(limits && (limits.session || limits.weekly || limits.fableWeekly))
}

export function isRetryableUsageFailure(limits: ProviderRateLimits | null | undefined): boolean {
  const kind = limits?.usageMetadata?.failureKind
  return kind !== undefined && RETRYABLE_FAILURE_KINDS.has(kind)
}

/**
 * Snapshot for a managed-account usage fetch that threw instead of returning.
 *
 * Recording nothing drops the account out of the inactive-usage array, and its
 * switcher row then renders blank, which reads as "no usage" rather than
 * naming the reason it could not be read.
 */
export function failedManagedAccountUsageResult(
  provider: ProviderRateLimits['provider'],
  error: unknown,
  usageMetadata?: UsageRateLimitMetadata
): ProviderRateLimits {
  return {
    provider,
    session: null,
    weekly: null,
    updatedAt: Date.now(),
    error: error instanceof Error ? error.message : 'Unknown error',
    status: 'error',
    usageMetadata
  }
}
