import { resizeGameState, type GameState, type InputState } from "./model.ts"
import { renderGame } from "./renderer.ts"
import { updateGame } from "./update.ts"

export interface GameLoop {
  resetClock: () => void
  dispose: () => void
}

export function startGameLoop(
  canvas: HTMLCanvasElement,
  state: GameState,
  input: InputState,
  onFrame: (now: number) => void,
): GameLoop {
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas 2D is unavailable")

  let frame = 0
  let previous = performance.now()

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    const density = Math.min(window.devicePixelRatio || 1, 3)
    canvas.width = Math.max(1, Math.round(rect.width * density))
    canvas.height = Math.max(1, Math.round(rect.height * density))
    resizeGameState(state, rect.width, rect.height)
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.fillStyle = "#03040a"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.setTransform(density, 0, 0, density, 0, 0)
    context.imageSmoothingEnabled = false
    renderGame(context, state)
  }

  const tick = (now: number) => {
    const delta = Math.min((now - previous) / 1_000, 0.05)
    previous = now
    updateGame(state, input, delta)
    renderGame(context, state)
    onFrame(now)
    frame = requestAnimationFrame(tick)
  }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()
  frame = requestAnimationFrame(tick)

  return {
    resetClock: () => {
      previous = performance.now()
    },
    dispose: () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    },
  }
}
