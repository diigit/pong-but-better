import { vector } from "2d-geometry";
import type { Gamemaster } from "../gamemaster";
import { DEFAULT_BALL_SPEED } from "../constants";

export class DefaultGamemode {
	public static async create(gamemaster: Gamemaster): Promise<DefaultGamemode> {
		gamemaster.resetBall();
		gamemaster.ball.velocity = vector(-DEFAULT_BALL_SPEED, 0)

		return new DefaultGamemode(gamemaster);
	}

	public destroy() {
		this.gamemaster.resetBall();
	}

	private constructor(
		private gamemaster: Gamemaster,
	) {
		console.log(this.gamemaster);
	}
}
