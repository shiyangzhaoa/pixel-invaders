import type { ControlSource, DispatchControl } from "./types.ts"

export interface KeyboardControlOptions {
  target: Window
  dispatch: DispatchControl
  onPause: () => void
}

export function bindKeyboardControl(options: KeyboardControlOptions): ControlSource {
  let left = false
  let right = false

  const handleKey = (event: KeyboardEvent, pressed: boolean) => {
    if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault()

    if (event.code === "ArrowLeft" || event.code === "KeyA") left = pressed
    if (event.code === "ArrowRight" || event.code === "KeyD") right = pressed
    if (event.code === "Space") options.dispatch({ shoot: pressed })
    if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(event.code)) {
      options.dispatch({ left, right, pointerX: undefined })
    }
    if (pressed && event.code === "Escape") options.onPause()
  }

  const keydown = (event: KeyboardEvent) => handleKey(event, true)
  const keyup = (event: KeyboardEvent) => handleKey(event, false)
  options.target.addEventListener("keydown", keydown)
  options.target.addEventListener("keyup", keyup)

  return {
    reset: () => {
      left = false
      right = false
      options.dispatch({ left: false, right: false, shoot: false, pointerX: undefined })
    },
    dispose: () => {
      options.target.removeEventListener("keydown", keydown)
      options.target.removeEventListener("keyup", keyup)
    },
  }
}
