import { vector } from "2d-geometry";
import type { Gamemaster } from "../gamemaster";
import { BALL_SPEED } from "../constants";

export class DefaultGamemode {
	public static async create(gamemaster: Gamemaster): Promise<DefaultGamemode> {
		return new DefaultGamemode(gamemaster);
	}

	public startRound() {
		this.gamemaster.ball.velocity = vector(BALL_SPEED * (Math.round(Math.random()) * 2 - 1), Math.random() * 10 - 20)
	}

	public endRound() {
		this.gamemaster.resetBall();
	}

	public destroy() {
		
	}

	private constructor(
		private gamemaster: Gamemaster,
	) { }
}
