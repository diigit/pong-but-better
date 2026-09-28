import { run_within_worker } from "../pkg/pong_but_better";

onmessage = event => { 	
	let [vertexBuffer, indexBuffer, dataBuffer] = event.data;
	
	run_within_worker(
		vertexBuffer, 
		indexBuffer,
		dataBuffer
	).catch(console.error);
}

postMessage("ready");