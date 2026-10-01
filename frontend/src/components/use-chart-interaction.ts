import {
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

// Maps a pointer position in pixels inside the plot area to a value index.
export type HitTest = (
  x: number,
  y: number,
  width: number,
  height: number,
) => number | null

// One active value per chart, set by every kind of input: mouse or pen hover,
// touch taps and horizontal scrubbing, and keyboard stepping once the plot is
// focused. Values are indexed 0..count-1 in stepping order.
export function useChartInteraction(count: number, hitTest: HitTest) {
  const [active, setActive] = useState<number | null>(null)
  const area = useRef<HTMLDivElement>(null)
  // Set while a pointer press is focusing the plot, so that focus keeps the
  // value the press picked instead of jumping to the first.
  const pressing = useRef(false)
  const current = active !== null && active < count ? active : null

  // A tap anywhere outside the chart dismisses a popover a touch left open.
  useEffect(() => {
    if (current === null) return
    const dismiss = (event: globalThis.PointerEvent) => {
      if (!area.current?.contains(event.target as Node)) setActive(null)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [current])

  const pick = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    setActive(
      hitTest(
        event.clientX - rect.left,
        event.clientY - rect.top,
        rect.width,
        rect.height,
      ),
    )
  }

  const keys: Record<string, (index: number | null) => number | null> = {
    ArrowRight: (index) =>
      index === null ? 0 : Math.min(index + 1, count - 1),
    ArrowLeft: (index) => (index === null ? 0 : Math.max(index - 1, 0)),
    Home: () => 0,
    End: () => count - 1,
    Escape: () => null,
  }

  return {
    active: current,
    areaProps: {
      ref: area,
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
        pressing.current = true
        // Keep scrubbing while a finger or pen drifts off the plot.
        if (event.pointerType !== 'mouse') {
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch {
            // The pointer is already gone; there is nothing to capture.
          }
        }
        pick(event)
      },
      onPointerMove: pick,
      onPointerUp: () => {
        pressing.current = false
      },
      onPointerLeave: (event: PointerEvent<HTMLDivElement>) => {
        // A touch popover stays after the finger lifts.
        if (event.pointerType !== 'touch') setActive(null)
      },
      onFocus: (event: FocusEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return
        if (!pressing.current && current === null) setActive(0)
        pressing.current = false
      },
      onBlur: () => {
        pressing.current = false
        setActive(null)
      },
      onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
        const next = keys[event.key]
        if (!next || count === 0) return
        event.preventDefault()
        setActive(next(current))
      },
    },
  }
}
