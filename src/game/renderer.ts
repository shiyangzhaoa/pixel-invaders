import type { Enemy, GameState } from "./model.ts"

const palette = {
  space: "#03040a",
  star: "#687080",
  C: "#5ce5e4",
  M: "#d333d5",
  A: "#ffcb6b",
  W: "#f7f7ff",
  R: "#ff6b87",
} as const

type PixelColor = keyof Pick<typeof palette, "C" | "M" | "A" | "W" | "R">
type PixelSprite = readonly string[]

const playerSprite: PixelSprite = [
  "       C       ",
  "      CCC      ",
  "      CWC      ",
  "     CCWCC     ",
  "     CCCCC     ",
  "    CCCCCCC    ",
  "   CCCMCMCCC   ",
  "  CCCCMCMCCCC  ",
  " CCCCCCCCCCCCC ",
  "CCCCCCCCCCCCCCC",
  "CCC CC C CC CCC",
  "CC  CC C CC  CC",
  "C   M     M   C",
  "    M     M    ",
  "    R     R    ",
]

const enemySprites: readonly PixelSprite[] = [
  [
    "   MM MM   ",
    "  MMMMMMM  ",
    " MMWWMWWMM ",
    "MMMMMMMMMMM",
    "M MMMMMMM M",
    "M M     M M",
    "  MM   MM  ",
    " M  M M  M ",
  ],
  [
    "    AA    ",
    "   AAAA   ",
    " AAAAAAAA ",
    "AAWAAAAWAA",
    "AAAAAAAAAA",
    " A AAAA A ",
    "A A    A A",
    "  A    A  ",
  ],
  [
    " C      C ",
    "  CCCCCCC ",
    " CCWCCWCCC",
    "CCCCCCCCCC",
    " CCCCCCCC ",
    "  CC  CC  ",
    " C  CC  C ",
    "C        C",
  ],
]

const playerShot: PixelSprite = ["W", "C", "C", "C", "C", "W"]
const enemyShot: PixelSprite = ["R", "M", "M", "M", "R"]

export function renderGame(context: CanvasRenderingContext2D, state: GameState): void {
  context.fillStyle = palette.space
  context.fillRect(0, 0, state.world.x, state.world.y)
  drawStars(context, state)

  const attractMode = state.status === "ready" || state.status === "game-over"
  if (attractMode) {
    drawAttractMode(context, state)
  } else {
    for (const enemy of state.enemies) drawEnemy(context, enemy, state)
    if (state.invulnerable === 0 || Math.floor(state.elapsed / 0.09) % 2 === 0)
      drawCenteredSprite(context, playerSprite, state.player.x, state.player.y, spriteScale(state))

    for (const bullet of state.bullets)
      drawCenteredSprite(context, playerShot, bullet.x, bullet.y, 3)
    for (const bullet of state.enemyBullets)
      drawCenteredSprite(context, enemyShot, bullet.x, bullet.y, 3)

    drawParticles(context, state)
    if (state.waveDelay > 0) drawWaveClear(context, state)
  }
}

function drawAttractMode(context: CanvasRenderingContext2D, state: GameState): void {
  const scale = spriteScale(state)
  const centerX = state.world.x / 2
  const formationY = Math.max(200, state.world.y * 0.38)
  for (let row = 0; row < 3; row += 1) {
    const sprite = enemySprites[row]
    if (!sprite) continue
    for (let column = 0; column < 5; column += 1) {
      const phase = column * 0.7 + row
      drawCenteredSprite(
        context,
        sprite,
        centerX + (column - 2) * 56 + Math.sin(state.elapsed * 1.2 + phase) * 10,
        formationY + row * 46 + Math.sin(state.elapsed * 1.7 + phase) * 3,
        scale,
      )
    }
  }
  drawCenteredSprite(
    context,
    playerSprite,
    centerX + Math.sin(state.elapsed * 1.2) * 10,
    Math.min(state.world.y - 88, formationY + 210),
    scale,
  )
}

function drawEnemy(context: CanvasRenderingContext2D, enemy: Enemy, state: GameState): void {
  const sprite = enemySprites[enemy.row % enemySprites.length]
  if (!sprite) return
  if (enemy.mode !== "diving") {
    drawCenteredSprite(context, sprite, enemy.x, enemy.y, spriteScale(state))
    return
  }
  context.save()
  context.translate(Math.round(enemy.x), Math.round(enemy.y))
  context.rotate(Math.sin(state.elapsed * 5 + enemy.phase) * 0.42)
  drawCenteredSprite(context, sprite, 0, 0, spriteScale(state))
  context.restore()
}

function drawCenteredSprite(
  context: CanvasRenderingContext2D,
  sprite: PixelSprite,
  centerX: number,
  centerY: number,
  pixel: number,
): void {
  const columns = Math.max(...sprite.map((row) => row.length))
  const x = Math.round(centerX - (columns * pixel) / 2)
  const y = Math.round(centerY - (sprite.length * pixel) / 2)
  for (let row = 0; row < sprite.length; row += 1) {
    const line = sprite[row]
    if (!line) continue
    for (let column = 0; column < line.length; column += 1) {
      const code = line[column] as PixelColor | " "
      if (code === " " || !(code in palette)) continue
      context.fillStyle = palette[code]
      context.fillRect(x + column * pixel, y + row * pixel, pixel, pixel)
    }
  }
}

function drawParticles(context: CanvasRenderingContext2D, state: GameState): void {
  const colors = { cyan: palette.C, pink: palette.M, yellow: palette.A }
  for (const particle of state.particles) {
    context.globalAlpha = Math.min(1, particle.life * 4)
    context.fillStyle = colors[particle.color]
    context.fillRect(
      Math.round(particle.x - particle.size / 2),
      Math.round(particle.y - particle.size / 2),
      particle.size,
      particle.size,
    )
  }
  context.globalAlpha = 1
}

function drawWaveClear(context: CanvasRenderingContext2D, state: GameState): void {
  context.fillStyle = palette.A
  context.font = "bold 24px monospace"
  context.textAlign = "center"
  context.fillText(
    `WAVE ${String(state.wave).padStart(2, "0")} CLEAR`,
    state.world.x / 2,
    state.world.y / 2,
  )
  context.textAlign = "start"
}

function drawStars(context: CanvasRenderingContext2D, state: GameState): void {
  drawStarLayer(context, state, 27, 397, 211, 4, 0.24)
  drawStarLayer(context, state, 14, 283, 157, 9, 0.4)
  drawStarLayer(context, state, 7, 173, 97, 17, 0.78, true)
  context.globalAlpha = 1
}

function drawStarLayer(
  context: CanvasRenderingContext2D,
  state: GameState,
  count: number,
  xStep: number,
  yStep: number,
  speed: number,
  alpha: number,
  cyan = false,
): void {
  context.fillStyle = cyan ? palette.C : palette.star
  context.globalAlpha = alpha
  for (let index = 0; index < count; index += 1) {
    const x = (index * xStep + count * 13) % state.world.x
    const y = (index * yStep + count * 17 + state.elapsed * speed) % state.world.y
    const size = cyan && index % 3 === 0 ? 2 : 1
    context.fillRect(Math.round(x), Math.round(y), size, size)
  }
}

const spriteScale = (state: GameState) => (state.world.x < 760 ? 3 : 4)
