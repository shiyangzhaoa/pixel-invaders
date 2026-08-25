import type { Enemy, GameState, InputState, Particle, Vector } from "./model.ts"
import { createWave } from "./model.ts"

const playerSpeed = 410
const bulletSpeed = 560
const fireInterval = 0.145

export function updateGame(state: GameState, input: InputState, delta: number): void {
  if (state.status === "ready" || state.status === "game-over") {
    state.elapsed += delta
    return
  }
  if (state.status !== "playing") return
  state.elapsed += delta
  state.invulnerable = Math.max(0, state.invulnerable - delta)
  updatePlayer(state, input, delta)
  updateEnemies(state, delta)
  updateBullets(state, delta)
  updateParticles(state, delta)
  resolveCollisions(state)
  if (state.ships <= 0) return
  advanceWave(state, delta)
  state.highScore = Math.max(state.highScore, state.score)
}

function updatePlayer(state: GameState, input: InputState, delta: number): void {
  const directionX = Number(input.right) - Number(input.left)
  const directionY = Number(input.down) - Number(input.up)
  if (directionX !== 0 || directionY !== 0) {
    const magnitude = Math.max(1, Math.hypot(directionX, directionY))
    state.player.x = clamp(
      state.player.x + (directionX / magnitude) * playerSpeed * delta,
      28,
      state.world.x - 28,
    )
    state.player.y = clamp(
      state.player.y + (directionY / magnitude) * playerSpeed * delta,
      108,
      state.world.y - 28,
    )
    input.pointerX = undefined
    input.pointerY = undefined
  } else if (input.pointerX !== undefined && input.pointerY !== undefined) {
    const targetX = clamp(input.pointerX, 32, state.world.x - 32)
    const targetY = clamp(input.pointerY, 108, state.world.y - 32)
    const distanceX = targetX - state.player.x
    const distanceY = targetY - state.player.y
    const distance = Math.hypot(distanceX, distanceY)
    if (distance < 3) {
      state.player.x = targetX
      state.player.y = targetY
    } else {
      const trackingSpeed = Math.min(760, Math.max(220, distance * 9))
      const movement = Math.min(distance, trackingSpeed * delta)
      state.player.x = clamp(
        state.player.x + (distanceX / distance) * movement,
        32,
        state.world.x - 32,
      )
      state.player.y = clamp(
        state.player.y + (distanceY / distance) * movement,
        108,
        state.world.y - 32,
      )
    }
  }

  state.cooldown = Math.max(0, state.cooldown - delta)
  if (state.cooldown === 0) {
    state.bullets.push({
      x: state.player.x,
      y: state.player.y - 24,
      speed: bulletSpeed,
      velocityX: 0,
    })
    state.events.push({ type: "player-shot" })
    state.cooldown = fireInterval
  }
}

function updateEnemies(state: GameState, delta: number): void {
  const settings = waveSettings(state.wave)
  state.diveCooldown -= delta
  state.enemyCooldown -= delta

  if (state.diveCooldown <= 0) {
    const divers = state.enemies.filter((enemy) => enemy.mode === "diving").length
    const candidates = state.enemies.filter((enemy) => enemy.mode === "formation")
    if (divers < settings.maximumDivers && candidates.length) {
      const enemy = candidates[nextRandom(state, candidates.length)]
      if (enemy) beginDive(enemy, state.player.x)
    }
    state.diveCooldown = settings.diveInterval
  }

  for (const enemy of state.enemies) updateEnemy(enemy, state, delta)

  if (state.enemyCooldown <= 0 && state.enemies.length) {
    const shooters = eligibleShooters(state.enemies)
    const enemy = shooters[nextRandom(state, shooters.length)]
    if (enemy) {
      const dx = state.player.x - enemy.x
      const dy = state.player.y - enemy.y
      const distance = Math.max(1, Math.hypot(dx, dy))
      state.enemyBullets.push({
        x: enemy.x,
        y: enemy.y + 18,
        speed: settings.enemyBulletSpeed * (dy / distance),
        velocityX: settings.enemyBulletSpeed * (dx / distance),
      })
    }
    state.enemyCooldown = settings.fireInterval
  }
}

function eligibleShooters(enemies: readonly Enemy[]): Enemy[] {
  const lowestByColumn = new Map<number, Enemy>()
  const divers: Enemy[] = []
  for (const enemy of enemies) {
    if (enemy.mode === "diving") {
      // A duplicate gives attacking enemies twice the selection weight.
      divers.push(enemy, enemy)
      continue
    }
    if (enemy.mode !== "formation") continue
    const column = Math.round(enemy.origin.x)
    const current = lowestByColumn.get(column)
    if (!current || enemy.origin.y > current.origin.y) lowestByColumn.set(column, enemy)
  }
  return [...lowestByColumn.values(), ...divers]
}

function updateEnemy(enemy: Enemy, state: GameState, delta: number): void {
  enemy.diveTime += delta
  if (enemy.mode === "formation") {
    enemy.x = enemy.origin.x + Math.sin(state.elapsed + enemy.phase) * 15
    enemy.y = enemy.origin.y + Math.sin(state.elapsed * 1.4 + enemy.phase) * 4
    return
  }

  const duration = Math.max(1.3, 2.45 - state.wave * 0.065)
  const progress = clamp(enemy.diveTime / duration, 0, 1)
  if (enemy.mode === "diving") {
    enemy.x =
      lerp(enemy.diveFrom.x, enemy.diveTargetX, progress * 0.72) +
      Math.sin(progress * Math.PI * 2 + enemy.phase) * 120
    enemy.y = lerp(enemy.diveFrom.y, state.world.y + 70, progress)
    if (progress >= 1) {
      enemy.mode = "returning"
      enemy.diveTime = 0
      enemy.diveFrom = { x: enemy.origin.x, y: 35 }
      enemy.x = enemy.diveFrom.x
      enemy.y = enemy.diveFrom.y
    }
    return
  }

  enemy.x = lerp(enemy.diveFrom.x, enemy.origin.x, progress)
  enemy.y = lerp(enemy.diveFrom.y, enemy.origin.y, progress)
  if (progress >= 1) enemy.mode = "formation"
}

function updateBullets(state: GameState, delta: number): void {
  for (const bullet of state.bullets) {
    bullet.x += (bullet.velocityX ?? 0) * delta
    bullet.y -= bullet.speed * delta
  }
  for (const bullet of state.enemyBullets) {
    bullet.x += (bullet.velocityX ?? 0) * delta
    bullet.y += bullet.speed * delta
  }
  state.bullets = state.bullets.filter((bullet) => bullet.y > -30)
  state.enemyBullets = state.enemyBullets.filter(
    (bullet) => bullet.y < state.world.y + 30 && bullet.x > -40 && bullet.x < state.world.x + 40,
  )
}

function resolveCollisions(state: GameState): void {
  for (let bulletIndex = state.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
    const bullet = state.bullets[bulletIndex]
    if (!bullet) continue
    const enemyIndex = state.enemies.findIndex((enemy) => hits(bullet, enemy, 26, 22))
    if (enemyIndex < 0) continue
    const enemy = state.enemies[enemyIndex]
    const diving = enemy?.mode === "diving"
    state.score += diving ? 200 : 100
    if (enemy) spawnBurst(state, enemy, diving ? "yellow" : "pink")
    state.events.push({ type: "enemy-destroyed", diving })
    state.bullets.splice(bulletIndex, 1)
    state.enemies.splice(enemyIndex, 1)
  }

  if (state.invulnerable > 0) return
  const bulletIndex = state.enemyBullets.findIndex((bullet) => hits(bullet, state.player, 29, 19))
  const enemyIndex = state.enemies.findIndex((enemy) => hits(enemy, state.player, 34, 25))
  if (bulletIndex < 0 && enemyIndex < 0) return
  if (bulletIndex >= 0) state.enemyBullets.splice(bulletIndex, 1)
  if (enemyIndex >= 0) state.enemies.splice(enemyIndex, 1)
  state.ships -= 1
  state.invulnerable = 1.25
  spawnBurst(state, state.player, "cyan")
  state.events.push({ type: "player-hit" })
  if (state.ships <= 0) {
    state.status = "game-over"
    state.events.push({ type: "game-over", score: state.score })
  }
}

function advanceWave(state: GameState, delta: number): void {
  if (state.enemies.length) return
  if (state.waveDelay === 0) {
    state.score += state.wave * 500
    state.events.push({ type: "wave-cleared", wave: state.wave })
    state.waveDelay = 0.9
    state.enemyBullets = []
    return
  }
  state.waveDelay -= delta
  if (state.waveDelay > 0) return
  state.wave += 1
  state.enemies = createWave(state.wave, state.world.x)
  state.waveDelay = 0
}

function updateParticles(state: GameState, delta: number): void {
  for (const particle of state.particles) {
    particle.x += particle.velocity.x * delta
    particle.y += particle.velocity.y * delta
    particle.life -= delta
  }
  state.particles = state.particles.filter((particle) => particle.life > 0)
}

function spawnBurst(state: GameState, position: Vector, color: Particle["color"]): void {
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2 + randomUnit(state) * 0.35
    const speed = 55 + randomUnit(state) * 100
    state.particles.push({
      x: position.x,
      y: position.y,
      velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      life: 0.25 + randomUnit(state) * 0.2,
      color,
      size: index % 3 === 0 ? 6 : 4,
    })
  }
}

const beginDive = (enemy: Enemy, targetX: number) => {
  enemy.mode = "diving"
  enemy.diveTime = 0
  enemy.diveFrom = { x: enemy.x, y: enemy.y }
  enemy.diveTargetX = targetX
}

const waveSettings = (wave: number) => ({
  diveInterval: Math.max(0.9, 2.3 - wave * 0.11),
  fireInterval: Math.max(0.62, 1.7 - wave * 0.075),
  enemyBulletSpeed: 170 + wave * 12,
  maximumDivers: Math.min(4, 1 + Math.floor(wave / 2)),
})

const nextRandom = (state: GameState, length: number) => {
  return Math.floor(randomUnit(state) * length)
}

const randomUnit = (state: GameState) => {
  state.seed = (Math.imul(state.seed, 1_664_525) + 1_013_904_223) >>> 0
  return state.seed / 0x1_0000_0000
}

const hits = (a: Vector, b: Vector, halfWidth: number, halfHeight: number) =>
  Math.abs(a.x - b.x) <= halfWidth && Math.abs(a.y - b.y) <= halfHeight

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))
