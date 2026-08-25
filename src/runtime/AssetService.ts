import { Context, Effect, Layer } from "effect"

export interface AssetManifest {
  source: "procedural"
}

export interface AssetServiceShape {
  load: Effect.Effect<AssetManifest>
}

export class AssetService extends Context.Tag("pixel-invaders/AssetService")<
  AssetService,
  AssetServiceShape
>() {}

export const AssetServiceLive = Layer.succeed(AssetService, {
  load: Effect.succeed({ source: "procedural" as const }),
})
