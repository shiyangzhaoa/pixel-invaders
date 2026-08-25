import { Effect } from "effect"
import type { GameEvent } from "../../game/model.ts"
import type { AudioCue, AudioServiceShape } from "../AudioService.ts"
import type { StorageServiceShape } from "../StorageService.ts"

export const handleGameEvents = (
  events: readonly GameEvent[],
  audio: AudioServiceShape,
  storage: StorageServiceShape,
) =>
  Effect.forEach(
    events,
    (event) => {
      const sound = audio.play(cueFor(event))
      return event.type === "game-over"
        ? Effect.all([sound, storage.saveBestScore(event.score)], {
            concurrency: "unbounded",
          }).pipe(Effect.asVoid)
        : sound
    },
    { concurrency: "unbounded", discard: true },
  )

const cueFor = (event: GameEvent): AudioCue => {
  switch (event.type) {
    case "player-shot":
      return "shoot"
    case "enemy-destroyed":
      return "enemy-hit"
    case "player-hit":
      return "player-hit"
    case "wave-cleared":
      return "wave-clear"
    case "game-over":
      return "game-over"
  }
}
