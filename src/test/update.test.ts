import { describe, expect, it } from "vitest"
import { createGameState, createWave } from "../game/model.ts"
import { updateGame } from "../game/update.ts"

describe("updateGame", () => {
  it("moves the player without leaving the playfield", () => {
    const state = createGameState()
    state.status = "playing"
    updateGame(state, { left: true, right: false, shoot: false }, 10)
    expect(state.player.x).toBe(28)
  })

  it("creates a bullet and applies a firing cooldown", () => {
    const state = createGameState()
    state.status = "playing"
    updateGame(state, { left: false, right: false, shoot: true }, 0.016)
    expect(state.bullets).toHaveLength(1)
    expect(state.cooldown).toBeGreaterThan(0)
  })

  it("does not advance while paused", () => {
    const state = createGameState()
    state.status = "paused"
    updateGame(state, { left: false, right: true, shoot: true }, 1)
    expect(state.player.x).toBe(480)
    expect(state.bullets).toHaveLength(0)
  })

  it("smoothly follows a pointer target inside the player bounds", () => {
    const state = createGameState()
    state.status = "playing"
    updateGame(state, { left: false, right: false, shoot: false, pointerX: 2_000 }, 0.016)
    expect(state.player.x).toBeGreaterThan(480)
    expect(state.player.x).toBeLessThan(928)

    updateGame(state, { left: false, right: false, shoot: false, pointerX: 2_000 }, 10)
    expect(state.player.x).toBe(928)
  })

  it("returns to keyboard movement after pointer control is cleared", () => {
    const state = createGameState()
    state.status = "playing"
    updateGame(state, { left: true, right: false, shoot: false, pointerX: undefined }, 0.1)
    expect(state.player.x).toBeLessThan(480)
  })

  it("gives an active keyboard direction priority over pointer tracking", () => {
    const state = createGameState()
    state.status = "playing"
    const input = { left: true, right: false, shoot: false, pointerX: 900 as number | undefined }
    updateGame(state, input, 0.1)
    expect(state.player.x).toBeLessThan(480)
    expect(input.pointerX).toBeUndefined()
  })

  it("only lets the lowest formation enemy in a column fire", () => {
    const state = createGameState()
    state.status = "playing"
    const wave = createWave(1)
    const firstColumn = wave[0]?.origin.x
    state.enemies = wave.filter((enemy) => enemy.origin.x === firstColumn)
    state.enemyCooldown = 0
    state.diveCooldown = 999
    updateGame(state, { left: false, right: false, shoot: false }, 0.016)
    expect(state.enemyBullets).toHaveLength(1)
    expect(state.enemyBullets[0]?.y).toBeGreaterThan(230)
  })

  it("does not let returning enemies fire", () => {
    const state = createGameState()
    state.status = "playing"
    const enemy = createWave(1)[0]
    if (!enemy) throw new Error("wave did not create an enemy")
    enemy.mode = "returning"
    state.enemies = [enemy]
    state.enemyCooldown = 0
    state.diveCooldown = 999
    updateGame(state, { left: false, right: false, shoot: false }, 0.016)
    expect(state.enemyBullets).toHaveLength(0)
  })

  it("awards points when a player shot hits an enemy", () => {
    const state = createGameState()
    state.status = "playing"
    state.enemies = [
      {
        id: 1,
        row: 0,
        x: 480,
        y: 200,
        origin: { x: 480, y: 200 },
        phase: 0,
        mode: "formation",
        diveTime: 0,
        diveFrom: { x: 480, y: 200 },
        diveTargetX: 480,
      },
    ]
    state.bullets = [{ x: 480, y: 205, speed: 0 }]
    updateGame(state, { left: false, right: false, shoot: false }, 0.016)
    expect(state.score).toBe(600)
    expect(state.enemies).toHaveLength(0)
  })

  it("removes a ship and grants temporary invulnerability on enemy fire", () => {
    const state = createGameState()
    state.status = "playing"
    state.enemies = []
    state.enemyBullets = [{ x: state.player.x, y: state.player.y, speed: 0 }]
    updateGame(state, { left: false, right: false, shoot: false }, 0.016)
    expect(state.ships).toBe(2)
    expect(state.invulnerable).toBeGreaterThan(1)
  })
})
