import { run_within_worker } from "../pkg/pong_but_better";
import { indices, Renderer, vertices } from "./render";

let renderer = new Renderer;

run_within_worker(
	vertices, 
	indices, 
	(canvas: OffscreenCanvas | undefined) => {
		renderer.canvas = canvas;
	}
).catch(console.error);

function renderLoop() {
	renderer.draw();
	requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);