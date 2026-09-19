import { memory } from "../pkg/pong_but_better_bg.wasm"

export function send_vertices(a: number) {
	console.log("Hello", memory.buffer, a)
}