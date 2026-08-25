import { bindKeyboardControl, bindPointerControl, type ControlSource } from "./controls/index.ts"
import type { InputState } from "./model.ts"

export interface InputBinding {
  state: InputState
  reset: () => void
  dispose: () => void
}

export function bindInput(canvas: HTMLCanvasElement, onTogglePause: () => void): InputBinding {
  const state: InputState = { left: false, right: false, up: false, down: false }
  const dispatch = (patch: Partial<InputState>) => Object.assign(state, patch)
  const sources: ControlSource[] = [
    bindKeyboardControl({ target: window, dispatch, onPause: onTogglePause }),
    bindPointerControl({ canvas, dispatch }),
  ]

  return {
    state,
    reset: () => {
      for (const source of sources) source.reset()
    },
    dispose: () => {
      for (const source of sources) source.dispose()
    },
  }
}
