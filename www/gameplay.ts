import { run_within_worker } from "../pkg/pong_but_better";

onmessage = event => { 	
	let [vertexBuffer, indexBuffer] = event.data;
	
	run_within_worker(
		vertexBuffer, 
		indexBuffer,
	);
}

postMessage("ready");