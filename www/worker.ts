import { run_within_worker } from "../pkg/pong_but_better";
import { ENTITY_SIZE_BYTES, MAX_ENTITIES } from "./constants";
import { indices, Renderer, vertices } from "./render";

let renderer = new Renderer();

let entityData = new SharedArrayBuffer(MAX_ENTITIES * ENTITY_SIZE_BYTES + 1);

let gameStep = run_within_worker(
	vertices,
	indices,
	entityData,
	ENTITY_SIZE_BYTES,
	(canvas: OffscreenCanvas | undefined) => {
		renderer.canvas = canvas;
	},
);

const channel = new MessageChannel();
channel.port1.onmessage = () => {
	gameStep()
	channel.port2.postMessage("message");
}
channel.port2.postMessage("message");

function renderLoop() {
	renderer.draw();
	requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

