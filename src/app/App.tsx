import { createSignal, onSettled } from "solid-js"
import { GameRuntime, type GameController } from "../runtime/GameRuntime.ts"
import { initialHud, type Hud } from "../game/model.ts"
import { GameHud } from "./GameHud.tsx"
import { GameOverlay } from "./GameOverlay.tsx"
import "../styles.css"

export default function App() {
  const [hud, setHud] = createSignal<Hud>(initialHud)
  let canvas: HTMLCanvasElement | undefined
  let controller: GameController | undefined

  onSettled(() => {
    if (!canvas) return
    controller = GameRuntime.launch(canvas, setHud)
    return () => controller?.dispose()
  })

  const handlePrimaryAction = () => {
    if (hud().status === "ready") controller?.start()
    else if (hud().status === "paused") controller?.togglePause()
    else controller?.restart()
  }

  return (
    <main class="shell">
      <header class="topbar">
        <strong class="brand">PIXEL INVADERS</strong>
        <span class="topbar-meta">
          <b>RUNTIME ONLINE</b>
          <span>BEST {hud().highScore.toString().padStart(6, "0")}</span>
        </span>
      </header>

      <section class="cabinet" aria-label="Pixel Invaders arcade game">
        <GameHud hud={hud()} />
        <div class="screen">
          <canvas
            ref={(element) => {
              canvas = element
            }}
            aria-label="Game canvas. Move the pointer to steer the ship."
          />
          <GameOverlay
            status={hud().status}
            highScore={hud().highScore}
            onAction={handlePrimaryAction}
          />
        </div>

        <footer class="controls">
          <p class="help sr-only">
            <span
              class="status-light"
              data-running={hud().status === "playing"}
              aria-hidden="true"
            />
            {hud().status.toUpperCase()} · POINTER / A D TO MOVE · CLICK / SPACE TO FIRE · ESC TO
            PAUSE
          </p>
          <div class="control-actions">
            <button
              class="icon-button"
              type="button"
              disabled={hud().status !== "playing" && hud().status !== "paused"}
              onClick={() => controller?.togglePause()}
            >
              <span>{hud().status === "paused" ? "RESUME" : "PAUSE"}</span>
            </button>
            <button class="icon-button" type="button" onClick={() => controller?.exit()}>
              <span>EXIT</span>
            </button>
          </div>
        </footer>
      </section>
    </main>
  )
}
