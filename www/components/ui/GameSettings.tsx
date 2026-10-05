import { dependencyContext } from "../../main";
import { BotDifficulty, Gamemode } from "../../gamemaster";
import { Evt } from "evt";
import React from "react";

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
	const dependencies = React.useContext(dependencyContext);
	const [gamemode, setGamemode] = React.useState(Gamemode.Normal);
	const [botDifficulty, setBotDifficulty] = React.useState(BotDifficulty.Easy);

	React.useEffect(() => {
		const ctx = Evt.newCtx();

		dependencies.gamemaster.botDifficultyChanged.attach(ctx, setBotDifficulty);
		dependencies.gamemaster.gamemodeChanged.attach(ctx, setGamemode);

		return () => {
			ctx.done();
		};
	}, [dependencies.gamemaster, gamemode, botDifficulty]);

	if (gamemode !== dependencies.gamemaster.gamemode)
		setGamemode(dependencies.gamemaster.gamemode);
	if (botDifficulty !== dependencies.gamemaster.botDifficulty)
		setBotDifficulty(dependencies.gamemaster.botDifficulty);

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
								dependencies.gamemaster.botDifficulty = BotDifficulty.Easy;
							}}
							selected={botDifficulty === BotDifficulty.Easy}
							text="Easy"
						/>
						<SettingsButton
							onClick={() => {
								dependencies.gamemaster.botDifficulty = BotDifficulty.Medium;
							}}
							selected={botDifficulty === BotDifficulty.Medium}
							text="Medium"
						/>
						<SettingsButton
							onClick={() => {
								dependencies.gamemaster.botDifficulty = BotDifficulty.Hard;
							}}
							selected={botDifficulty === BotDifficulty.Hard}
							text="Hard"
						/>
					</div>
				</div>
				<div className="bg-white/30 rounded-xl w-fit h-fit drop-shadow-xl border-2 border-white/20 px-2 py-1 gap-1 m-1">
					<p className="font-sans font-bold text-title/70 text-xs text-center">
						GAMEMODES
					</p>
					<div className="flex flex-row gap-2 m-1">
						<SettingsButton
							onClick={() => {
								dependencies.gamemaster.gamemode = Gamemode.Normal;
							}}
							selected={gamemode === Gamemode.Normal}
							text="Normal"
						/>
						<SettingsButton
							onClick={() => {
								dependencies.gamemaster.gamemode = Gamemode.Obstacles;
							}}
							selected={gamemode === Gamemode.Obstacles}
							text="Obstacles"
						/>
						<SettingsButton
							onClick={() => {
								dependencies.gamemaster.gamemode = Gamemode.ManyBalls;
							}}
							selected={gamemode === Gamemode.ManyBalls}
							text="Too Many Balls"
						/>
						<SettingsButton
							onClick={() => {
								dependencies.gamemaster.gamemode = Gamemode.ExplodeYourPC;
							}}
							selected={gamemode === Gamemode.ExplodeYourPC}
							text="Explode Your PC"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
