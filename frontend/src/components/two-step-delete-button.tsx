import { LoaderCircle, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type TwoStepDeleteButtonProps = {
  label: string
  prompt: string
  confirmLabel: string
  cancelLabel: string
  pendingLabel: string
  pending: boolean
  onConfirm: () => void
}

export function TwoStepDeleteButton({
  label,
  prompt,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  pending,
  onConfirm,
}: TwoStepDeleteButtonProps) {
  const [armed, setArmed] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const disarmedByUser = useRef(false)

  useEffect(() => {
    if (armed) {
      cancelRef.current?.focus()
    } else if (disarmedByUser.current) {
      disarmedByUser.current = false
      triggerRef.current?.focus()
    }
  }, [armed])

  if (!armed) {
    return (
      <button
        className="button button-danger"
        ref={triggerRef}
        type="button"
        onClick={() => setArmed(true)}
      >
        <Trash2 aria-hidden="true" size={17} />
        {label}
      </button>
    )
  }

  return (
    <fieldset className="delete-confirm">
      <legend>{prompt}</legend>
      <div className="delete-confirm-actions">
        <button
          className="button button-danger-solid"
          disabled={pending}
          type="button"
          onClick={onConfirm}
        >
          {pending ? (
            <LoaderCircle className="spin" aria-hidden="true" size={17} />
          ) : (
            <Trash2 aria-hidden="true" size={17} />
          )}
          {pending ? pendingLabel : confirmLabel}
        </button>
        <button
          className="button button-secondary"
          disabled={pending}
          ref={cancelRef}
          type="button"
          onClick={() => {
            disarmedByUser.current = true
            setArmed(false)
          }}
        >
          {cancelLabel}
        </button>
      </div>
    </fieldset>
  )
}
