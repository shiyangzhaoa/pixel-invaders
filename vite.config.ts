import solid from "@solidjs/vite-plugin"
import { defineConfig } from "vite"

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/pixel-invaders/" : "/",
  plugins: [solid()],
  build: { target: "esnext" },
})
