import { Effect, Layer } from "effect"
import { describe, expect, it } from "vitest"
import { AssetService } from "../runtime/AssetService.ts"
import { StorageService } from "../runtime/StorageService.ts"
import { loadGame } from "../runtime/programs/loadGame.ts"

describe("loadGame", () => {
  it("loads assets and persisted score through runtime services", () => {
    const testLayer = Layer.merge(
      Layer.succeed(AssetService, { load: Effect.succeed({ source: "procedural" as const }) }),
      Layer.succeed(StorageService, {
        loadBestScore: Effect.succeed(420),
        saveBestScore: () => Effect.void,
      }),
    )

    const result = Effect.runSync(loadGame.pipe(Effect.provide(testLayer)))
    expect(result).toEqual({ assets: { source: "procedural" }, bestScore: 420 })
  })
})
