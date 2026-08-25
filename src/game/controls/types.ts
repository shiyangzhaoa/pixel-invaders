import type { InputState } from "../model.ts"

export type ControlPatch = Partial<InputState>
export type DispatchControl = (patch: ControlPatch) => void

export interface ControlSource {
  reset: () => void
  dispose: () => void
}
