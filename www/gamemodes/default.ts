import { vector } from "2d-geometry";
import type { Gamemaster } from "../gamemaster";
import { BALL_SPEED } from "../constants";
import { Gamemode } from ".";

export class DefaultGamemode extends Gamemode {
	public startRound() {
		this.gamemaster.ball.velocity = vector(
			BALL_SPEED * (Math.round(Math.random()) * 2 - 1),
			Math.random() * 10 - 20,
		);
	}

	public endRound() {
		this.gamemaster.resetBall();
	}

	public destroy() {}

	constructor(protected gamemaster: Gamemaster) {
		super();
	}
}
