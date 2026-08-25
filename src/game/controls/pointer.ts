import type { ControlSource, DispatchControl } from "./types.ts"

export interface PointerControlOptions {
  canvas: HTMLCanvasElement
  dispatch: DispatchControl
}

export function bindPointerControl(options: PointerControlOptions): ControlSource {
  const updateTarget = (event: PointerEvent) => {
    const rect = options.canvas.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    const touchOffset = event.pointerType === "touch" ? 58 : 0
    const pointerY = event.clientY - rect.top - touchOffset
    options.dispatch({ pointerX, pointerY })
  }
  const pointermove = (event: PointerEvent) => updateTarget(event)
  const pointerdown = (event: PointerEvent) => {
    updateTarget(event)
    options.canvas.setPointerCapture?.(event.pointerId)
  }
  const pointercancel = () => options.dispatch({ pointerX: undefined, pointerY: undefined })

  options.canvas.addEventListener("pointermove", pointermove)
  options.canvas.addEventListener("pointerdown", pointerdown)
  options.canvas.addEventListener("pointercancel", pointercancel)

  return {
    reset: pointercancel,
    dispose: () => {
      options.canvas.removeEventListener("pointermove", pointermove)
      options.canvas.removeEventListener("pointerdown", pointerdown)
      options.canvas.removeEventListener("pointercancel", pointercancel)
    },
  }
}
