import type { Automation } from '../../../../shared/types'
import type { AutomationHostTarget } from './automation-host-client'

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
 * Every host the automations list should read from.
 *
 * The list used to follow the single active runtime environment, so an
 * automation on any other host was invisible rather than merely inactive.
 */
export function getAutomationListTargets(
  environments: readonly { id: string }[]
): AutomationHostTarget[] {
  const targets: AutomationHostTarget[] = [{ kind: 'local' }]
  const seen = new Set<string>()
  for (const environment of environments) {
    const environmentId = environment.id?.trim()
    if (!environmentId || seen.has(environmentId)) {
      continue
    }
    seen.add(environmentId)
    targets.push({ kind: 'environment', environmentId })
  }
  return targets
}

export function targetKey(target: AutomationHostTarget): string {
  return target.kind === 'local' ? 'local' : `environment:${target.environmentId}`
}

/**
 * Merge per-host listings into one view.
 *
 * A host that fails is reported rather than thrown, because one unreachable
 * environment must not empty a list that is mostly reachable.
 */
export function mergeAutomationListings(
  listings: readonly {
    target: AutomationHostTarget
    automations: Automation[] | null
  }[]
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
      // Why: a runtime environment can mirror a local automation, and two rows
      // for one automation would each route actions to a different host.
      if (seenIds.has(automation.id)) {
        continue
      }
      seenIds.add(automation.id)
      automations.push({ automation, target: listing.target })
    }
  }
  return { automations, unreachableEnvironmentIds }
}
