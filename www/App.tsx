import GameWindow from "./components/ui/GameWindow";
import { GameSettings } from "./components/ui/GameSettings";
import { ENABLE_SETTINGS } from "./constants";

export function App() {
	return (
		<div className="w-dvw h-dvh flex flex-col items-center gap-10 p-10 justify-center">
			<div className="flex items-center flex-col">
				<p className="font-sans font-bold text-4xl text-title text-shadow-sm">
					Pong, but Better
				</p>
				<p className="font-light text-black/50 italic text-center">version 1.0.0</p>
			</div>
			<GameWindow />
			{ENABLE_SETTINGS ? <GameSettings /> : undefined}
		</div>
	);
}

export default App;
