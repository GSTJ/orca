import type { ProviderRateLimits } from '../../../../shared/rate-limit-types'
import { translate } from '@/i18n/i18n'

/**
 * True when a snapshot exists but carries no usable window, which is what a
 * failed credential read looks like: `status: 'error'` with every window null.
 */
export function isUnavailableInactiveUsage(limits: ProviderRateLimits | null | undefined): boolean {
  return limits?.status === 'error' && !limits.session && !limits.weekly && !limits.fableWeekly
}

/**
 * True when only a fresh sign-in can clear the failure.
 *
 * A throttled or offline account still has working credentials, so prompting
 * for a sign-in there sends the user to fix something that is not broken.
 */
export function usageFailureNeedsSignIn(limits: ProviderRateLimits | null | undefined): boolean {
  switch (limits?.usageMetadata?.failureKind) {
    case 'rate-limited':
    case 'network':
    case 'server':
    case 'parse':
    case 'deferred-by-live-session':
      return false
    default:
      return true
  }
}

/** Short reason for a row that has no usable usage window. */
export function describeUsageFailure(limits: ProviderRateLimits | null | undefined): string {
  switch (limits?.usageMetadata?.failureKind) {
    case 'rate-limited':
      return translate(
        'auto.components.status.bar.usage.availability.rateLimited',
        'Rate limited, retrying'
      )
    case 'network':
      return translate('auto.components.status.bar.usage.availability.offline', 'Offline, retrying')
    case 'server':
    case 'parse':
      return translate(
        'auto.components.status.bar.usage.availability.retrying',
        'Usage unavailable, retrying'
      )
    case 'deferred-by-live-session':
      return translate(
        'auto.components.status.bar.usage.availability.deferred',
        'Waiting for the live session'
      )
    case 'keychain-unavailable':
      return translate(
        'auto.components.status.bar.usage.availability.keychain',
        'Keychain unavailable'
      )
    default:
      return translate('auto.components.status.bar.StatusBar.f19a63e7cd', 'Sign in to see usage')
  }
}
