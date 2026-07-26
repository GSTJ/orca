import type { Automation } from '../../../../shared/automations-types'
import type { AutomationHostListing, AutomationHostTarget } from './automation-host-client'

export type AutomationWithHost = {
  automation: Automation
  target: AutomationHostTarget
}

export type AutomationFanoutResult = {
  automations: AutomationWithHost[]
  /** Environment ids whose listing failed, so the UI can say the view is partial. */
  unreachableEnvironmentIds: string[]
}

/**
 * Merge per-host listings into one view.
 *
 * A host that failed arrives as a null listing and is reported rather than
 * dropped silently, because one unreachable environment must not look the same
 * as an environment with no automations.
 */
export function mergeAutomationListings(
  listings: readonly AutomationHostListing[]
): AutomationFanoutResult {
  const automations: AutomationWithHost[] = []
  const unreachableEnvironmentIds: string[] = []
  const seenIds = new Set<string>()
  for (const listing of listings) {
    if (listing.automations === null) {
      if (listing.target.kind === 'environment') {
        unreachableEnvironmentIds.push(listing.target.environmentId)
      }
      continue
    }
    for (const automation of listing.automations) {
      // Why: an environment can mirror a local automation, and two rows for one
      // automation would each route actions to a different host.
      if (seenIds.has(automation.id)) {
        continue
      }
      seenIds.add(automation.id)
      automations.push({ automation, target: listing.target })
    }
  }
  return { automations, unreachableEnvironmentIds }
}
