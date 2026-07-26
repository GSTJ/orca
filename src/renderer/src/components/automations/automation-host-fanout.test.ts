import { describe, expect, it } from 'vitest'
import type { Automation } from '../../../../shared/automations-types'
import { getAutomationHostTargetKey } from './automation-host-client'
import { mergeAutomationListings } from './automation-host-fanout'

function automation(id: string): Automation {
  return { id, name: id } as unknown as Automation
}

describe('mergeAutomationListings', () => {
  it('keeps each automation tagged with the host it came from', () => {
    const merged = mergeAutomationListings([
      { target: { kind: 'local' }, automations: [automation('a')] },
      { target: { kind: 'environment', environmentId: 'env-1' }, automations: [automation('b')] }
    ])

    expect(
      merged.automations.map((row) => [row.automation.id, getAutomationHostTargetKey(row.target)])
    ).toEqual([
      ['a', 'local'],
      ['b', 'environment:env-1']
    ])
    expect(merged.unreachableEnvironmentIds).toEqual([])
  })

  // Why: the whole point of the fan-out. One dead environment used to be able to
  // take the entire list down with it.
  it('keeps reachable hosts when one environment fails', () => {
    const merged = mergeAutomationListings([
      { target: { kind: 'local' }, automations: [automation('a')] },
      { target: { kind: 'environment', environmentId: 'env-1' }, automations: null }
    ])

    expect(merged.automations.map((row) => row.automation.id)).toEqual(['a'])
    expect(merged.unreachableEnvironmentIds).toEqual(['env-1'])
  })

  it('keeps the first host that reported a shared automation id', () => {
    const merged = mergeAutomationListings([
      { target: { kind: 'local' }, automations: [automation('shared')] },
      {
        target: { kind: 'environment', environmentId: 'env-1' },
        automations: [automation('shared')]
      }
    ])

    expect(merged.automations).toHaveLength(1)
    expect(getAutomationHostTargetKey(merged.automations[0]!.target)).toBe('local')
  })

  it('does not report a failed local listing as an unreachable environment', () => {
    const merged = mergeAutomationListings([{ target: { kind: 'local' }, automations: null }])

    expect(merged.automations).toEqual([])
    expect(merged.unreachableEnvironmentIds).toEqual([])
  })
})
