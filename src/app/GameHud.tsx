import type { Hud } from "../game/model.ts"

export function GameHud(props: { hud: Hud }) {
  return (
    <div class="hud" aria-live="polite">
      <HudItem label="SCORE" value={props.hud.score.toString().padStart(6, "0")} />
      <HudItem label="WAVE" value={props.hud.wave.toString().padStart(2, "0")} />
      <HudItem label="SHIPS" value={props.hud.ships.toString()} />
    </div>
  )
}

function HudItem(props: { label: string; value: string }) {
  return (
    <span class="hud-item">
      <small>{props.label}</small>
      <b>{props.value}</b>
    </span>
  )
}
