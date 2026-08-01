import { describe, expect, it } from 'vitest'
import { applyClaudeEnvPatch, claudeAuthEnvVarsToStrip } from './environment'

describe('applyClaudeEnvPatch', () => {
  it('sets the managed account token after stripping ambient auth env', () => {
    const env = applyClaudeEnvPatch(
      {
        CLAUDE_CODE_OAUTH_TOKEN: 'ambient-token',
        ANTHROPIC_API_KEY: 'ambient-key'
      },
      { CLAUDE_CODE_OAUTH_TOKEN: 'managed-token' },
      { stripAuthEnv: true }
    )

    expect(env.CLAUDE_CODE_OAUTH_TOKEN).toBe('managed-token')
    expect(env.ANTHROPIC_API_KEY).toBeUndefined()
  })

  it('still strips an ambient token when the patch does not set one', () => {
    const env = applyClaudeEnvPatch(
      { CLAUDE_CODE_OAUTH_TOKEN: 'ambient-token' },
      {},
      { stripAuthEnv: true }
    )

    expect(env.CLAUDE_CODE_OAUTH_TOKEN).toBeUndefined()
  })
})

describe('claudeAuthEnvVarsToStrip', () => {
  it('excludes keys the patch itself sets', () => {
    expect(claudeAuthEnvVarsToStrip({ CLAUDE_CODE_OAUTH_TOKEN: 'managed-token' })).toEqual([
      'ANTHROPIC_API_KEY',
      'ANTHROPIC_AUTH_TOKEN',
      'AWS_BEARER_TOKEN_BEDROCK',
      'ANTHROPIC_CUSTOM_HEADERS'
    ])
  })

  it('strips every auth var for patches without credentials', () => {
    expect(claudeAuthEnvVarsToStrip({ CLAUDE_CONFIG_DIR: '/tmp/managed' })).toEqual([
      'ANTHROPIC_API_KEY',
      'ANTHROPIC_AUTH_TOKEN',
      'CLAUDE_CODE_OAUTH_TOKEN',
      'AWS_BEARER_TOKEN_BEDROCK',
      'ANTHROPIC_CUSTOM_HEADERS'
    ])
  })
})
