import { Context, Effect, Layer } from "effect"

const bestScoreKey = "pixel-invaders.best-score"

export interface StorageServiceShape {
  loadBestScore: Effect.Effect<number>
  saveBestScore: (score: number) => Effect.Effect<void>
}

export class StorageService extends Context.Service<StorageService, StorageServiceShape>()(
  "pixel-invaders/StorageService",
) {}

export const StorageServiceLive = Layer.succeed(StorageService, {
  loadBestScore: Effect.sync(
    () => Number.parseInt(localStorage.getItem(bestScoreKey) ?? "0", 10) || 0,
  ),
  saveBestScore: (score) => Effect.sync(() => localStorage.setItem(bestScoreKey, score.toString())),
})
