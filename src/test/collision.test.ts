import { describe, expect, it } from "vitest"
import { pointHitsBounds, removeBulletsOutsidePlayfield } from "../game/collision.ts"

describe("collision helpers", () => {
  it("detects a point inside bounds", () => {
    expect(pointHitsBounds({ x: 12, y: 12 }, { x: 10, y: 10, width: 8, height: 8 })).toBe(true)
  })

  it("removes bullets above the playfield", () => {
    const bullets = [
      { x: 10, y: -21, speed: 100 },
      { x: 20, y: 40, speed: 100 },
    ]
    expect(removeBulletsOutsidePlayfield(bullets)).toEqual([bullets[1]])
  })
})
