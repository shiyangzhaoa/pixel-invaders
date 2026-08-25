import type { ControlSource, DispatchControl } from "./types.ts"

export interface KeyboardControlOptions {
  target: Window
  dispatch: DispatchControl
  onPause: () => void
}

export function bindKeyboardControl(options: KeyboardControlOptions): ControlSource {
  let left = false
  let right = false
  let up = false
  let down = false

  const handleKey = (event: KeyboardEvent, pressed: boolean) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.code))
      event.preventDefault()

    if (event.code === "ArrowLeft" || event.code === "KeyA") left = pressed
    if (event.code === "ArrowRight" || event.code === "KeyD") right = pressed
    if (event.code === "ArrowUp" || event.code === "KeyW") up = pressed
    if (event.code === "ArrowDown" || event.code === "KeyS") down = pressed
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD", "KeyW", "KeyS"].includes(
        event.code,
      )
    ) {
      options.dispatch({ left, right, up, down, pointerX: undefined, pointerY: undefined })
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
      up = false
      down = false
      options.dispatch({
        left: false,
        right: false,
        up: false,
        down: false,
        pointerX: undefined,
        pointerY: undefined,
      })
    },
    dispose: () => {
      options.target.removeEventListener("keydown", keydown)
      options.target.removeEventListener("keyup", keyup)
    },
  }
}
