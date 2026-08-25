import { Effect } from "effect"
import { AssetService, type AssetManifest } from "../AssetService.ts"
import { StorageService } from "../StorageService.ts"

export interface LoadedGame {
  assets: AssetManifest
  bestScore: number
}

export const loadGame = Effect.gen(function* () {
  const assets = yield* AssetService
  const storage = yield* StorageService
  const [manifest, bestScore] = yield* Effect.all([assets.load, storage.loadBestScore], {
    concurrency: "unbounded",
  })
  return { assets: manifest, bestScore } satisfies LoadedGame
})
