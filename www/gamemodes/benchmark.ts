import type { Gamemaster } from "../gamemaster";
import { Gamemode } from ".";

export class BenchmarkingGamemode extends Gamemode {
	public startRound() {}

	public endRound() {}

	public destroy() {}

	private constructor(private gamemaster: Gamemaster) {
		super();
		gamemaster.scoreTrackingEnabled = false;
	}
}
