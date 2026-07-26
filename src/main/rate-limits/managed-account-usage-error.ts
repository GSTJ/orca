import type { ProviderRateLimits } from '../../shared/rate-limit-types'

/**
 * Snapshot for a managed-account usage fetch that threw instead of returning.
 *
 * Recording nothing drops the account out of the inactive-usage array, and its
 * switcher row then renders blank, which reads as "no usage" rather than
 * "could not read this account" and hides the re-auth affordance.
 */
export function failedManagedAccountUsageResult(
  provider: ProviderRateLimits['provider'],
  error: unknown
): ProviderRateLimits {
  return {
    provider,
    session: null,
    weekly: null,
    updatedAt: Date.now(),
    error: error instanceof Error ? error.message : 'Unknown error',
    status: 'error'
  }
}
