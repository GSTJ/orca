import type { ProviderRateLimits } from '../../../../shared/rate-limit-types'
import { translate } from '@/i18n/i18n'

/** Absolute wall-clock time a window resets at, in the viewer's locale. */
export function formatResetAt(resetsAt: number): string {
  return new Date(resetsAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * When each usage window comes back, as absolute times.
 *
 * The bars alongside this carry the countdown; a countdown alone doesn't say
 * which clock it belongs to, and it can't be read against a calendar.
 */
export function formatUsageResetSummary(limits: ProviderRateLimits | null): string | null {
  if (!limits) {
    return null
  }
  const parts: string[] = []
  if (limits.session?.resetsAt) {
    parts.push(
      `${translate('auto.components.status.bar.usage.reset.session', 'session')} ${formatResetAt(limits.session.resetsAt)}`
    )
  }
  if (limits.weekly?.resetsAt) {
    parts.push(
      `${translate('auto.components.status.bar.usage.reset.weekly', 'weekly')} ${formatResetAt(limits.weekly.resetsAt)}`
    )
  }
  if (limits.fableWeekly?.resetsAt) {
    parts.push(
      `${translate('auto.components.status.bar.usage.reset.fable', 'Fable')} ${formatResetAt(limits.fableWeekly.resetsAt)}`
    )
  }
  if (parts.length === 0) {
    return null
  }
  return `${translate('auto.components.status.bar.usage.reset.prefix', 'Resets')} ${parts.join(' · ')}`
}
