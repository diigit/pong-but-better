import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/constants";
import { dependencyContext } from "@/frontend";
import React from "react";

export function GameWindow() {
	const canvasElementRef = React.useRef(null as null | HTMLCanvasElement);
	const dependencies = React.useContext(dependencyContext);

	const [selfScore, setSelfScore] = React.useState(-1);
	const [oppScore, setOppScore]  = React.useState(-1);
	const [gameIsActive, setGameActive] = React.useState(false);
	
	React.useEffect(() => {
		const canvasElement = canvasElementRef.current;
		if (!canvasElement) return;
		
		dependencies.renderer.setCanvas(canvasElement);

		return () => { dependencies.renderer.setCanvas(undefined) } 
	}, [canvasElementRef.current, dependencies.renderer])

	React.useEffect(() => {
		const selfScoreChangedEvt = dependencies.gameState.selfScoreChanged.attach(setSelfScore);
		const oppScoreChangedEvt = dependencies.gameState.oppScoreChanged.attach(setOppScore);
		const gameActivityChangedEvt = dependencies.gameState.gameActivityChanged.attach(setGameActive);

		if (selfScore === -1) setSelfScore(dependencies.gameState.selfScore);
		if (oppScore === -1) setOppScore(dependencies.gameState.oppScore);
		if (gameIsActive !== dependencies.gameState.isGameActive) setGameActive(dependencies.gameState.isGameActive);

		return () => {
			selfScoreChangedEvt.detach();
			oppScoreChangedEvt.detach();
			gameActivityChangedEvt.detach();
		}
	}, [dependencies.gameState])

	return (
		<div className="flex-none flex flex-col bg-white/30 rounded-xl w-fit h-fit drop-shadow-xl border-2 border-white/20 overflow-hidden">
			<div key="top bar" className="flex flex-row px-2 py-2 bg-white/30">
				<p key="left score" className="font-sans font-medium text-lg text-normal-text/80 justify-start text-left items-center bg-black/4 text-shadow-sm px-2 py-1 rounded-xl">Your Score: {selfScore}</p>
				<div key="spacer" className="grow"/> 
 				<p key="right score" className="font-sans font-medium text-lg text-normal-text/80 justify-end text-right items-center bg-black/4 text-shadow-sm px-2 py-1 rounded-xl">Opponent Score: {oppScore}</p>
			</div>
			<div className="m-2.5 relative z-1">
				<canvas className={`${!gameIsActive ? "blur-xs" : ""}`} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={canvasElementRef}/>
				{!gameIsActive ? 
					<div className="absolute flex flex-col justify-center items-center top-0 left-0 w-full h-full gap-3">
						<p className="font-sans font-light text-xl text-normal-text/80 text-shadow-sm">{
							selfScore > oppScore ? "You won! Play again?" : 
							oppScore > selfScore ? `Hah, loser! Play again?` : 
							"Ready to play?"
						}</p>
						<button 
							type="button" 
							className="font-sans font-bold text-lg text-normal-text/80 px-4 py-1 bg-white/30 border-2 border-white/20 rounded-xl hover:bg-gray-100/30 hover:scale-110 active:scale-90 cursor-pointer transition-all text-shadow-sm" 
							onClick={() => dependencies.gameState.start()}
						>PLAY</button>
					</div>
				: undefined}
			</div>
		</div>
	)
}

export default GameWindow;