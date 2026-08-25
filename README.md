# Pixel Invaders

An experiment in browser-game architecture. Native Canvas owns the hot path, Solid 2 owns the interface, and Effect coordinates lifecycle and asynchronous side effects.

[Play the latest build](https://shiyangzhaoa.github.io/pixel-invaders/)

## Development

```bash
mise install
pnpm install
pnpm dev
```

Vite prints the development URL. Run `pnpm dev -- --port 5176` to use a fixed port.

## Controls

- Move the pointer or drag: smoothly steer toward the target anywhere on the playfield
- `WASD` or arrow keys: four-direction keyboard movement with control priority
- Weapons fire automatically while playing
- `Escape`: pause or resume
- Hiding or blurring the page automatically pauses and clears active input

## Quality checks

```bash
pnpm check
```

- `tsgo`: TypeScript 7 Native Preview type checking
- `oxlint`: linting
- `oxfmt`: formatting
- `vitest`: game-core tests

## Architecture

```text
src/
├── app/                 Solid 2 interface
├── game/                Framework-free synchronous game core
│   └── controls/        Independent keyboard and pointer control sources
├── runtime/             Services, layers, and runtime entry point
│   └── programs/        Loading, session, wave, and domain-event programs
├── test/
└── main.tsx             Standard Vite client entry point
```

Dependencies flow in one direction: `app → runtime → game`. The game core imports neither Solid nor Effect, so it remains independently testable. The runtime composes browser resources, audio, storage, and lifecycle concerns.

The high-frequency Canvas update remains synchronous and emits `GameEvent` values. Effect consumes only discrete events such as shots, collisions, wave completion, and game over, coordinating audio and storage concurrently without creating asynchronous work every frame.

## Deployment

Pushes to `main` are built and deployed to GitHub Pages by `.github/workflows/deploy-pages.yml`.
