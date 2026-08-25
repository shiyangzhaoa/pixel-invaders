import { Effect } from "effect"
import { createWave, type GameState } from "../../game/model.ts"

export const runWave = (state: GameState, wave: number) =>
  Effect.sync(() => {
    state.wave = wave
    state.enemies = createWave(wave, state.world.x)
    state.enemyBullets = []
    state.waveDelay = 0
    state.status = "playing"
  })
