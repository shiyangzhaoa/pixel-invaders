import { Effect, Layer } from "effect"
import type { Hud } from "../game/model.ts"
import { AssetServiceLive } from "./AssetService.ts"
import { AudioServiceLive } from "./AudioService.ts"
import { StorageServiceLive } from "./StorageService.ts"
import { runGame, type GameSession } from "./programs/runGame.ts"

const GameLive = Layer.mergeAll(AssetServiceLive, AudioServiceLive, StorageServiceLive)

export type GameController = GameSession

export const GameRuntime = {
  launch(canvas: HTMLCanvasElement, publishHud: (hud: Hud) => void): GameController {
    return Effect.runSync(runGame(canvas, publishHud).pipe(Effect.provide(GameLive)))
  },
}
