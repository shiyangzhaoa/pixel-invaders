export interface Vector {
  x: number
  y: number
}

export interface Bullet extends Vector {
  speed: number
  velocityX?: number
}

export type EnemyMode = "formation" | "diving" | "returning"

export interface Enemy extends Vector {
  id: number
  row: number
  origin: Vector
  phase: number
  mode: EnemyMode
  diveTime: number
  diveFrom: Vector
  diveTargetX: number
}

export interface Particle extends Vector {
  velocity: Vector
  life: number
  color: "cyan" | "pink" | "yellow"
  size: number
}

export type GameEvent =
  | { type: "player-shot" }
  | { type: "enemy-destroyed"; diving: boolean }
  | { type: "player-hit" }
  | { type: "wave-cleared"; wave: number }
  | { type: "game-over"; score: number }

export interface GameState {
  world: Vector
  player: Vector
  bullets: Bullet[]
  enemyBullets: Bullet[]
  enemies: Enemy[]
  particles: Particle[]
  events: GameEvent[]
  score: number
  highScore: number
  wave: number
  ships: number
  cooldown: number
  enemyCooldown: number
  diveCooldown: number
  invulnerable: number
  waveDelay: number
  elapsed: number
  seed: number
  status: GameStatus
}

export interface InputState {
  left: boolean
  right: boolean
  shoot: boolean
  pointerX?: number
}

export interface Hud {
  score: number
  highScore: number
  wave: number
  ships: number
  status: GameStatus
}

export type GameStatus = "ready" | "playing" | "paused" | "game-over"

export const initialHud: Hud = {
  score: 0,
  highScore: 0,
  wave: 1,
  ships: 3,
  status: "ready",
}

export const toHud = (state: GameState): Hud => ({
  score: state.score,
  highScore: state.highScore,
  wave: state.wave,
  ships: state.ships,
  status: state.status,
})

export const createGameState = (highScore = 0): GameState => ({
  world: { x: 960, y: 540 },
  player: { x: 480, y: 480 },
  bullets: [],
  enemyBullets: [],
  enemies: [],
  particles: [],
  events: [],
  score: 0,
  highScore,
  wave: 1,
  ships: 3,
  cooldown: 0,
  enemyCooldown: 1,
  diveCooldown: 1,
  invulnerable: 0,
  waveDelay: 0,
  elapsed: 0,
  seed: 0x51f15e,
  status: "ready",
})

export function createWave(wave: number, width = 960): Enemy[] {
  const columns = width < 600 ? 5 : 8
  const availableWidth = Math.max(240, width - 64)
  const spacing = Math.min(72, availableWidth / Math.max(1, columns - 1))
  const left = (width - spacing * (columns - 1)) / 2
  return Array.from({ length: columns * 3 }, (_, id) => {
    const row = Math.floor(id / columns)
    const column = id % columns
    const origin = { x: left + column * spacing, y: 134 + row * 54 }
    return {
      id,
      row,
      x: origin.x,
      y: origin.y,
      origin,
      phase: column * 0.55 + row * 0.8,
      mode: "formation",
      diveTime: 0,
      diveFrom: { ...origin },
      diveTargetX: origin.x,
    }
  })
}

export function resizeGameState(state: GameState, width: number, height: number): void {
  const previousWidth = state.world.x
  const ratio = width / previousWidth
  state.world = { x: width, y: height }
  state.player.x = Math.min(width - 32, Math.max(32, state.player.x * ratio))
  state.player.y = height * 0.78
  for (const enemy of state.enemies) {
    enemy.origin.x *= ratio
    enemy.x *= ratio
    enemy.diveFrom.x *= ratio
    enemy.diveTargetX *= ratio
  }
}
