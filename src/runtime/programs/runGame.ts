import { Effect } from "effect"
import { bindInput } from "../../game/input.ts"
import { startGameLoop } from "../../game/loop.ts"
import { createGameState, toHud, type GameStatus, type Hud } from "../../game/model.ts"
import { AudioService } from "../AudioService.ts"
import { StorageService } from "../StorageService.ts"
import { loadGame } from "./loadGame.ts"
import { handleGameEvents } from "./handleGameEvents.ts"
import { runWave } from "./runWave.ts"

export interface GameSession {
  start: () => void
  togglePause: () => void
  restart: () => void
  exit: () => void
  dispose: () => void
}

export const runGame = (canvas: HTMLCanvasElement, publishHud: (hud: Hud) => void) =>
  Effect.gen(function* () {
    const audio = yield* AudioService
    const storage = yield* StorageService
    const loaded = yield* loadGame
    const state = createGameState(loaded.bestScore)

    let lastHud = 0
    const publish = () => publishHud(toHud(state))
    const play = (cue: Parameters<typeof audio.play>[0]) => Effect.runFork(audio.play(cue))

    const setStatus = (status: GameStatus) => {
      state.status = status
      loop.resetClock()
      publish()
    }

    const togglePause = () => {
      if (state.status !== "playing" && state.status !== "paused") return
      const next = state.status === "playing" ? "paused" : "playing"
      setStatus(next)
      if (next === "paused") input.reset()
      play(next === "paused" ? "pause" : "resume")
    }

    const input = bindInput(canvas, togglePause)
    const pauseWhenHidden = () => {
      if (document.visibilityState !== "visible" && state.status === "playing") {
        setStatus("paused")
        input.reset()
        play("pause")
      }
    }
    const pauseWhenBlurred = () => {
      if (state.status === "playing") {
        setStatus("paused")
        input.reset()
        play("pause")
      }
    }
    document.addEventListener("visibilitychange", pauseWhenHidden)
    window.addEventListener("blur", pauseWhenBlurred)
    const loop = startGameLoop(canvas, state, input.state, (now) => {
      if (state.events.length) {
        const events = state.events.splice(0)
        Effect.runFork(handleGameEvents(events, audio, storage))
      }
      if (now - lastHud > 100) {
        publish()
        lastHud = now
      }
    })
    publish()

    return {
      start: () => {
        Effect.runSync(runWave(state, state.wave))
        loop.resetClock()
        publish()
        play("start")
      },
      togglePause,
      restart: () => {
        Effect.runFork(storage.saveBestScore(state.highScore))
        const fresh = createGameState(state.highScore)
        Object.assign(state, fresh)
        Effect.runSync(runWave(state, 1))
        loop.resetClock()
        publish()
        play("restart")
      },
      exit: () => {
        Effect.runFork(storage.saveBestScore(state.highScore))
        const fresh = createGameState(state.highScore)
        fresh.world = { ...state.world }
        fresh.player = { x: state.world.x / 2, y: state.world.y * 0.78 }
        Object.assign(state, fresh)
        input.reset()
        loop.resetClock()
        publish()
      },
      dispose: () => {
        Effect.runFork(storage.saveBestScore(Math.max(loaded.bestScore, state.score)))
        input.dispose()
        document.removeEventListener("visibilitychange", pauseWhenHidden)
        window.removeEventListener("blur", pauseWhenBlurred)
        loop.dispose()
      },
    } satisfies GameSession
  })
