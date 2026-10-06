import { point, vector } from "2d-geometry";
import { Entity, Mass } from ".";
import { BOT_DIFFICULTY, CANVAS_HEIGHT, CANVAS_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH } from "../constants";

const BOT_PADDLE_POSITION = point(
	CANVAS_WIDTH - PADDLE_WIDTH,
	CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
);

const PLAYER_PADDLE_POSITION = point(0, CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);

export class Paddle extends Entity {
	public static readonly entityType: number = 2;

	constructor(
		view: DataView,
		_destroy: () => void,
		_setUpdating: () => void,
		setExtraComponent: (name: string, value: any) => void,
	) {
		super(view, _destroy, _setUpdating, setExtraComponent);

		this.mass = new Mass(true, 0);
		this.bounds = vector(PADDLE_WIDTH, PADDLE_HEIGHT);
		this.position = PLAYER_PADDLE_POSITION;
	}
}

export class BotPaddle extends Paddle {
	public static readonly entityType: number = 3;

	constructor(
		view: DataView,
		_destroy: () => void,
		_setUpdating: () => void,
		setExtraComponent: (name: string, value: any) => void,
	) {
		super(view, _destroy, _setUpdating, setExtraComponent);

		this.position = BOT_PADDLE_POSITION;
		this.maxSpeed = BOT_DIFFICULTY.EASY.PADDLE_MOVE_SPEED;
		this.predictionTime = BOT_DIFFICULTY.EASY.PREDICTION_TIME;
	}

	set maxSpeed(maxSpeed: number) {
		this.setExtraComponent("Max Speed", maxSpeed);
	}

	set predictionTime(predictionTime: number) {
		this.setExtraComponent("Prediction Time", predictionTime);
	}
}
