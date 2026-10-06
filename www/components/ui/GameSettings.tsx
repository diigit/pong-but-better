import { dependencyContext } from "../../main";
import { BotDifficulty, Gamemodes } from "../../gamemaster";
import { Evt } from "evt";
import React from "react";

const ENABLE_GAMEMODE_SWITCH = false;

function SettingsButton({
	text,
	selected,
	onClick,
}: {
	text: string;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<button
			className={`font-sans font-medium text-md text-normal-text/80 text-shadow-sm px-2 py-1 bg-black/4 rounded-xl ${selected ? "border" : "border-0"} border-black/20 transition-all hover:bg-black/7 hover:scale-105 active:scale-95 cursor-pointer`}
			onClick={onClick}
		>
			{text}
		</button>
	);
}

export function GameSettings() {
	const { gamemaster } = React.useContext(dependencyContext);
	const [gamemode, setGamemode] = React.useState(Gamemodes.Normal);
	const [botDifficulty, setBotDifficulty] = React.useState(BotDifficulty.Easy);

	React.useEffect(() => {
		const ctx = Evt.newCtx();

		gamemaster.botDifficultyChanged.attach(ctx, setBotDifficulty);
		gamemaster.gamemodeChanged.attach(ctx, setGamemode);

		return () => {
			ctx.done();
		};
	}, [gamemaster, gamemode, botDifficulty]);

	if (gamemode !== gamemaster.getGamemode()) setGamemode(gamemaster.getGamemode());
	if (botDifficulty !== gamemaster.getBotDifficulty())
		setBotDifficulty(gamemaster.getBotDifficulty());

	return (
		<div className="flex">
			<div className="flex flex-row items-center gap-2">
				<div className="bg-white/30 rounded-xl w-fit h-fit drop-shadow-xl border-2 border-white/20 px-2 py-1 gap-1 m-1">
					<p className="font-sans font-bold text-title/70 text-xs text-center">
						BOT DIFFICULTY
					</p>
					<div className="flex flex-row gap-2 m-1">
						<SettingsButton
							onClick={() => {
								gamemaster.changeBotDifficulty(BotDifficulty.Easy);
							}}
							selected={botDifficulty === BotDifficulty.Easy}
							text="Easy"
						/>
						<SettingsButton
							onClick={() => {
								gamemaster.changeBotDifficulty(BotDifficulty.Medium);
							}}
							selected={botDifficulty === BotDifficulty.Medium}
							text="Medium"
						/>
						<SettingsButton
							onClick={() => {
								gamemaster.changeBotDifficulty(BotDifficulty.Hard);
							}}
							selected={botDifficulty === BotDifficulty.Hard}
							text="Hard"
						/>
					</div>
				</div>
				{ENABLE_GAMEMODE_SWITCH ? (
					<div className="bg-white/30 rounded-xl w-fit h-fit drop-shadow-xl border-2 border-white/20 px-2 py-1 gap-1 m-1">
						<p className="font-sans font-bold text-title/70 text-xs text-center">
							GAMEMODES
						</p>
						<div className="flex flex-row gap-2 m-1">
							<SettingsButton
								onClick={() => {
									gamemaster.changeGamemode(Gamemodes.Normal);
								}}
								selected={gamemode === Gamemodes.Normal}
								text="Normal"
							/>
						</div>
					</div>
				) : undefined}
			</div>
		</div>
	);
}
