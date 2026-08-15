import { expect, test } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'

test('shows the setup-token requirements and limitations before saving', async ({ orcaPage }) => {
  await waitForSessionReady(orcaPage)
  await orcaPage.evaluate(() => {
    const state = window.__store!.getState()
    state.openSettingsTarget({ pane: 'accounts', repoId: null })
    state.openSettingsPage()
  })

  await expect(orcaPage.getByRole('heading', { name: 'AI Provider Accounts' })).toBeVisible()
  await orcaPage.getByRole('button', { name: 'Add setup token', exact: true }).click()

  const dialog = orcaPage.getByRole('dialog', { name: 'Add Claude setup token' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Run claude setup-token, then paste the one-year token.')
  await expect(dialog.getByLabel('Account label (required)')).toBeVisible()
  await expect(dialog.getByLabel('Setup token', { exact: true })).toHaveAttribute(
    'type',
    'password'
  )
  await expect(dialog).toContainText(
    'Setup tokens support only model requests, so Orca may not be able to show usage.'
  )
  await expect(dialog).toContainText('It does not revoke the token.')
  await expect(dialog).toContainText(
    'Claude does not currently document a way to list or revoke setup tokens.'
  )

  const addButton = dialog.getByRole('button', { name: 'Add setup token', exact: true })
  await expect(addButton).toBeDisabled()
  await dialog.getByLabel('Account label (required)').fill('Work Claude')
  await dialog.getByLabel('Setup token', { exact: true }).fill('setup-token-secret')
  await expect(addButton).toBeEnabled()
})
