import type { ControlSource, DispatchControl } from "./types.ts"

export interface PointerControlOptions {
  canvas: HTMLCanvasElement
  releaseTarget: Window
  dispatch: DispatchControl
}

export function bindPointerControl(options: PointerControlOptions): ControlSource {
  const updateTarget = (event: PointerEvent) => {
    const rect = options.canvas.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    options.dispatch({ pointerX })
  }
  const pointermove = (event: PointerEvent) => updateTarget(event)
  const pointerdown = (event: PointerEvent) => {
    updateTarget(event)
    options.canvas.setPointerCapture?.(event.pointerId)
    options.dispatch({ shoot: true })
  }
  const pointerup = () => options.dispatch({ shoot: false })
  const pointercancel = () => options.dispatch({ shoot: false, pointerX: undefined })

  options.canvas.addEventListener("pointermove", pointermove)
  options.canvas.addEventListener("pointerdown", pointerdown)
  options.releaseTarget.addEventListener("pointerup", pointerup)
  options.canvas.addEventListener("pointercancel", pointercancel)

  return {
    reset: pointercancel,
    dispose: () => {
      options.canvas.removeEventListener("pointermove", pointermove)
      options.canvas.removeEventListener("pointerdown", pointerdown)
      options.releaseTarget.removeEventListener("pointerup", pointerup)
      options.canvas.removeEventListener("pointercancel", pointercancel)
    },
  }
}
