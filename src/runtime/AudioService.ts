import { Context, Effect, Layer } from "effect"

export type AudioCue =
  | "start"
  | "pause"
  | "resume"
  | "restart"
  | "shoot"
  | "enemy-hit"
  | "player-hit"
  | "wave-clear"
  | "game-over"

export interface AudioServiceShape {
  play: (cue: AudioCue) => Effect.Effect<void>
}

export class AudioService extends Context.Tag("pixel-invaders/AudioService")<
  AudioService,
  AudioServiceShape
>() {}

const frequencies: Record<AudioCue, number> = {
  start: 660,
  pause: 220,
  resume: 440,
  restart: 330,
  shoot: 880,
  "enemy-hit": 150,
  "player-hit": 90,
  "wave-clear": 990,
  "game-over": 70,
}

export const AudioServiceLive = Layer.succeed(AudioService, {
  play: (cue) =>
    Effect.promise(async () => {
      const context = getAudioContext()
      if (context.state === "suspended") await context.resume()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = cue === "player-hit" || cue === "game-over" ? "sawtooth" : "square"
      oscillator.frequency.value = frequencies[cue]
      gain.gain.setValueAtTime(0.035, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + (cue === "game-over" ? 0.28 : 0.08))
    }),
})

let sharedAudioContext: AudioContext | undefined

function getAudioContext(): AudioContext {
  sharedAudioContext ??= new window.AudioContext()
  return sharedAudioContext
}
