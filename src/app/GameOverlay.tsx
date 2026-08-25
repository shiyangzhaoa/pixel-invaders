import type { GameStatus } from "../game/model.ts"

const overlayCopy = {
  ready: {
    title: "READY?",
    detail: "Move to steer. Weapons fire automatically.",
    action: "START GAME",
  },
  paused: { title: "PAUSED", detail: "The fleet is holding position.", action: "RESUME" },
  "game-over": {
    title: "GAME OVER",
    detail: "Signal lost. Rebuild the line.",
    action: "TRY AGAIN",
  },
  playing: { title: "", detail: "", action: "" },
} as const

export function GameOverlay(props: {
  status: GameStatus
  highScore: number
  onAction: () => void
}) {
  return (
    <div class="overlay" data-status={props.status} hidden={props.status === "playing"}>
      <div class="overlay-panel">
        {props.status !== "ready" && (
          <div class="pixel-mark" aria-hidden="true">
            {Array.from({ length: 7 }, () => (
              <span />
            ))}
          </div>
        )}
        <h1>{overlayCopy[props.status].title}</h1>
        {props.status === "ready" ? (
          <p class="high-score">
            HIGH <strong>{props.highScore.toString().padStart(6, "0")}</strong>
          </p>
        ) : (
          <p>{overlayCopy[props.status].detail}</p>
        )}
        <button class="arcade-button" type="button" onClick={props.onAction}>
          <span>{overlayCopy[props.status].action}</span>
        </button>
      </div>
    </div>
  )
}
