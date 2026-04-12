import { dependencyContext } from "@/frontend";
import React from "react";

function SettingsButton({ text, selected, onClick }: { text: string, selected: boolean, onClick: () => void }) {
  return <button className={`font-sans font-medium text-md text-normal-text/80 text-shadow-sm px-2 py-1 bg-black/4 rounded-xl ${selected ? "border" : "border-0"} border-black/20 transition-all hover:bg-black/7 hover:scale-105 active:scale-95 cursor-pointer`} onClick={onClick}>{text}</button>;
}

export function GameSettings() {
	const dependencies = React.useContext(dependencyContext);



	return <div className="flex-1">
		<div className="flex flex-row items-center gap-2">
			<div className="bg-white/30 rounded-xl w-fit h-fit drop-shadow-xl border-2 border-white/20 px-2 py-1 gap-1 m-1">
				<p className="font-sans font-bold text-title/70 text-xs text-center">BOT DIFFICULTY</p> 
				<div className="flex flex-row gap-2 m-1">
					<SettingsButton onClick={() => {}} selected={true} text="Easy"/>
					<SettingsButton onClick={() => {}} selected={false} text="Medium"/>
					<SettingsButton onClick={() => {}} selected={false} text="Hard"/>
				</div>
			</div>
			<div className="bg-white/30 rounded-xl w-fit h-fit drop-shadow-xl border-2 border-white/20 px-2 py-1 gap-1 m-1">
				<p className="font-sans font-bold text-title/70 text-xs text-center">GAMEMODES</p> 
				<div className="flex flex-row gap-2 m-1">
					<SettingsButton onClick={() => {}} selected={true} text="Normal"/>
					<SettingsButton onClick={() => {}} selected={false} text="50 Balls"/>
					<SettingsButton onClick={() => {}} selected={false} text="Obstacles"/>
				</div>
			</div>
		</div>
	</div>
}