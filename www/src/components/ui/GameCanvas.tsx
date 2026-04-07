import React from "react";

var beCool = false;

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 256;

export function GameCanvas() {
	let canvasElementRef = React.useRef(null as null | HTMLCanvasElement);
	
	React.useEffect(() => {
		let canvasElement = canvasElementRef.current;
		if (canvasElement === null) return;

		let gpu = window.navigator.gpu;
		if (gpu === undefined) Error("WebGPU is not supported by this browser.");

		const gpuStuff = async () => {
			let gpuAdapter = await gpu.requestAdapter();
			if (!gpuAdapter) throw Error("Unable to retrieve GPU Adapter.");

			let device = await gpuAdapter.requestDevice();
			if (!device) throw Error("Unable to retrieve GPU Device.");

			const context = canvasElement.getContext("webgpu") as GPUCanvasContext;
			context.configure({
				device,
				format: gpu.getPreferredCanvasFormat(),
			});

			console.log("success so far!");
		}	

		gpuStuff();

		return () => { }
	}, [canvasElementRef.current])
	
	const titleTextArr = [
		"ping pong",
		"wanna play pong?",
		"this is pong",
		"finally, a real game",
		"better graphics than GTA 6",
		"more difficult than tidal wave",
		"lived longer than Concord",
		"wassup",
		"culminating = massive cortisol spike",
		"help me",
		"i hope this one doesn\'t show up during my presentation",
		"triple T",
		"47 Chadwick Dr",
		"thorfinn",
		"build artemis III, make no mistakes",
		"at tel aviv rn",
	]

	const randomText = titleTextArr[Math.floor(Math.random() * titleTextArr.length)];

	return (
		<div className="flex flex-col bg-white/30 rounded-xl w-fit h-fit drop-shadow-xl backdrop-blur-sm border-2 border-white/20 overflow-hidden">
			<div className="px-4 py-2 bg-white/30">
				<p className="font-pixel text-xl text-title">{beCool ? randomText : "Pong Window"}</p>
			</div>
			<canvas className="w-lg h-64 m-2.5 rounded-b-[7px]" ref={canvasElementRef}/>
		</div>
	)
}

export default GameCanvas;