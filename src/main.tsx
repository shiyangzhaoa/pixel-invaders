import { render } from "@solidjs/web"
import App from "./app/App.tsx"

const root = document.querySelector("#root")

if (!root) throw new Error("Missing #root mount element")

render(() => <App />, root)
