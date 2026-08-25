import type { Bullet, Vector } from "./model.ts"

export interface Bounds extends Vector {
  width: number
  height: number
}

export function pointHitsBounds(point: Vector, bounds: Bounds): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  )
}

export function removeBulletsOutsidePlayfield(
  bullets: readonly Bullet[],
  minimumY = -20,
): Bullet[] {
  return bullets.filter((bullet) => bullet.y > minimumY)
}
