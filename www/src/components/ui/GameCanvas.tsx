export function GameCanvas() {
		
	
	return (
		<div className="flex flex-col bg-white/30 rounded-xl w-fit h-fit drop-shadow-xl backdrop-blur-sm border-2 border-white/20 overflow-hidden">
			<div className="px-4 py-2 bg-white/30">
				<p className="font-pixel text-xl text-title justify-self-center">ping pong</p>
			</div>
			<canvas className="w-lg h-64 m-2.5 rounded-b-[7px]"/>
		</div>
	)
}

export default GameCanvas;