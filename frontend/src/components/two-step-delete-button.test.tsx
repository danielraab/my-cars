import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TwoStepDeleteButton } from './two-step-delete-button'

function setup(pending = false) {
  const onConfirm = vi.fn()
  const result = render(
    <TwoStepDeleteButton
      label="Delete car"
      prompt="Delete this car?"
      confirmLabel="Yes, delete"
      cancelLabel="Keep car"
      pendingLabel="Deleting…"
      pending={pending}
      onConfirm={onConfirm}
    />,
  )
  return { onConfirm, ...result }
}

describe('TwoStepDeleteButton', () => {
  it('asks for confirmation before calling the action', async () => {
    const user = userEvent.setup()
    const { onConfirm } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete car' }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(
      screen.getByRole('group', { name: 'Delete this car?' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep car' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('returns to the initial button when cancelled', async () => {
    const user = userEvent.setup()
    const { onConfirm } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete car' }))
    await user.click(screen.getByRole('button', { name: 'Keep car' }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Yes, delete' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete car' })).toHaveFocus()
  })

  it('disables both choices while the action is pending', async () => {
    const user = userEvent.setup()
    const { rerender, onConfirm } = setup()
    await user.click(screen.getByRole('button', { name: 'Delete car' }))

    rerender(
      <TwoStepDeleteButton
        label="Delete car"
        prompt="Delete this car?"
        confirmLabel="Yes, delete"
        cancelLabel="Keep car"
        pendingLabel="Deleting…"
        pending
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Keep car' })).toBeDisabled()
  })
})
