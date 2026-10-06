import { Evt } from "evt";
import {
	BORDER_THICKNESS,
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	BALL_SIZE,
	PADDLE_HEIGHT,
	PADDLE_MOVE_SPEED,
	PADDLE_WIDTH,
	WINNING_SCORE,
	DOWN_KEYS,
	UP_KEYS,
	BOT_DIFFICULTY,
} from "./constants";
import { Middleman } from "../pkg/pong_but_better";
import { EntityTracker } from "./entity_tracker";
import { BotPaddle, Paddle } from "./entities/paddle";
import { Entity, Mass, BaseEntity } from "./entities";
import { point, vector } from "2d-geometry";
import { DefaultGamemode } from "./gamemodes/default";
import { Ball } from "./entities/ball";

const BOT_PADDLE_POSITION = point(
	CANVAS_WIDTH - PADDLE_WIDTH,
	CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
);

const PLAYER_PADDLE_POSITION = point(0, CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);

const BALL_CENTER_POSITION = point(
	CANVAS_WIDTH / 2 - BALL_SIZE / 2,
	CANVAS_HEIGHT / 2 - BALL_SIZE / 2,
);

export enum Gamemodes {
	Normal,
}

export enum BotDifficulty {
	Easy,
	Medium,
	Hard,
}

export class Gamemaster {
	public readonly selfScoreChanged = Evt.create<number>();
	public readonly oppScoreChanged = Evt.create<number>();
	public readonly gameActivityChanged = Evt.create<boolean>();
	public readonly gamemodeChanged = Evt.create<Gamemodes>();
	public readonly botDifficultyChanged = Evt.create<BotDifficulty>();

	public winningScore = WINNING_SCORE;

	private constructor(
		public readonly entityTracker: EntityTracker,
		public readonly playerPaddle: Paddle,
		public readonly botPaddle: BotPaddle,
		public readonly leftBoundary: Entity,
		public readonly rightBoundary: Entity,
		public readonly ball: Entity,
	) {
		this.createInputListeners();
	}

	static async create(worker: Worker, buffer: SharedArrayBuffer): Promise<Gamemaster> {
		let middleman = Middleman.new(worker);
		let entityTracker = new EntityTracker(worker, middleman, buffer);

		let upperBoundary = await entityTracker.createEntity(BaseEntity);
		upperBoundary.position = point(0, CANVAS_HEIGHT);
		upperBoundary.bounds = vector(CANVAS_WIDTH, BORDER_THICKNESS);
		upperBoundary.mass = new Mass(true, 0);

		let lowerBoundary = await entityTracker.createEntity(BaseEntity);
		lowerBoundary.position = point(0, -BORDER_THICKNESS);
		lowerBoundary.bounds = vector(CANVAS_WIDTH, BORDER_THICKNESS);
		lowerBoundary.mass = new Mass(true, 0);

		let leftBoundary = await entityTracker.createEntity(BaseEntity);
		leftBoundary.position = point(-BORDER_THICKNESS, 0);
		leftBoundary.bounds = vector(BORDER_THICKNESS, CANVAS_HEIGHT);
		leftBoundary.mass = new Mass(true, 0);

		let rightBoundary = await entityTracker.createEntity(BaseEntity);
		rightBoundary.position = point(CANVAS_WIDTH, 0);
		rightBoundary.bounds = vector(BORDER_THICKNESS, CANVAS_HEIGHT);
		rightBoundary.mass = new Mass(true, 0);

		let botPaddle = await entityTracker.createEntity(BotPaddle);
		let playerPaddle = await entityTracker.createEntity(Paddle);
		let ball = await entityTracker.createEntity(Ball);

		return new Gamemaster(
			entityTracker,
			playerPaddle,
			botPaddle,
			leftBoundary,
			rightBoundary,
			ball,
		);
	}

	async startMatch() {
		this.oppScore = 0;
		this.selfScore = 0;

		this.gamemode = await DefaultGamemode.create(this);
		this.isGameActive = true;

		this.createCollisionListeners();

		this.gamemode.startRound();
	}

	async endMatch() {
		this.gamemode?.destroy();
		this.isGameActive = false;

		this.deleteCollisionListeners();
	}

	resetBall() {
		this.ball.position = BALL_CENTER_POSITION;
		this.ball.velocity = vector(0, 0);

		this.playerPaddle.position = PLAYER_PADDLE_POSITION;
		this.playerPaddle.velocity = vector(0, 0);

		this.botPaddle.position = BOT_PADDLE_POSITION;
		this.botPaddle.velocity = vector(0, 0);
	}

	async checkWin() {
		if (this.isCheckingWin) return;
		this.isCheckingWin = true;

		let promise = new Promise((resolve) => {
			if (!this._isGameActive) {
				resolve(undefined);
			}

			this.gamemode?.endRound();
			if (this.oppScore >= this.winningScore) {
				// TODO
				resolve(this.endMatch());
			} else if (this.selfScore >= this.winningScore) {
				// TODO
				resolve(this.endMatch());
			} else {
				setTimeout(() => {
					resolve(undefined);
					this.gamemode?.startRound();
				}, 2000);
			}
		});

		return promise.then(() => {
			this.isCheckingWin = false;
		});
	}

	get isGameActive() {
		return this._isGameActive;
	}

	set isGameActive(active: boolean) {
		if (active === this.isGameActive) return;

		this._isGameActive = active;
		this.gameActivityChanged.post(active);
	}

	get selfScore(): number {
		return this._selfScore;
	}

	set selfScore(score: number) {
		this._selfScore = score;
		this.selfScoreChanged.post(score);
	}

	get oppScore(): number {
		return this._oppScore;
	}

	set oppScore(score: number) {
		this._oppScore = score;
		this.oppScoreChanged.post(score);
	}

	// TODO
	getGamemode() {
		return Gamemodes.Normal;
	}

	// TODO
	changeGamemode(newGamemode: Gamemodes) {
		this.selfScore = 0;
		this.oppScore = 0;

		this.endMatch().catch(console.error)

		this.gamemodeChanged.post(newGamemode);
	}

	changeBotDifficulty(newDifficulty: BotDifficulty) {
		this.botDifficulty = newDifficulty;
		this.botDifficultyChanged.post(newDifficulty);

		switch (newDifficulty) {
			case BotDifficulty.Easy: {
				this.botPaddle.maxSpeed = BOT_DIFFICULTY.EASY.PADDLE_MOVE_SPEED;
				this.botPaddle.predictionTime = BOT_DIFFICULTY.EASY.PREDICTION_TIME;
				break;
			}
			case BotDifficulty.Medium: {
				this.botPaddle.maxSpeed = BOT_DIFFICULTY.MEDIUM.PADDLE_MOVE_SPEED;
				this.botPaddle.predictionTime = BOT_DIFFICULTY.MEDIUM.PREDICTION_TIME;
				break;
			}
			case BotDifficulty.Hard: {
				this.botPaddle.maxSpeed = BOT_DIFFICULTY.HARD.PADDLE_MOVE_SPEED;
				this.botPaddle.predictionTime = BOT_DIFFICULTY.HARD.PREDICTION_TIME;
				break;
			}
		}
	}

	getBotDifficulty(): BotDifficulty {
		return this.botDifficulty;
	}

	private createCollisionListeners() {
		this.leftBoundary.collided.attach(this.collisionsCtx, (entity) => {
			if (this.ball != entity) return;

			this.oppScore += 1;
			this.checkWin().catch(console.error);
		});

		this.rightBoundary.collided.attach(this.collisionsCtx, (entity) => {
			if (this.ball != entity) return;

			this.selfScore += 1;
			this.checkWin().catch(console.error);
		});
	}

	private deleteCollisionListeners() {
		this.collisionsCtx.done();
		this.collisionsCtx = Evt.newCtx();
	}

	private updatePaddleMovement() {
		let yVel;

		if (
			!this.isGameActive ||
			(this.inputMoveDown && this.inputMoveUp) ||
			(!this.inputMoveDown && !this.inputMoveUp)
		) {
			yVel = 0;
		} else if (this.inputMoveDown) {
			yVel = -PADDLE_MOVE_SPEED;
		} else if (this.inputMoveUp) {
			yVel = PADDLE_MOVE_SPEED;
		}

		this.playerPaddle.velocity = vector(this.playerPaddle.velocity.x, yVel);
	}

	private collisionsCtx = Evt.newCtx();

	private createInputListeners() {
		let handleEvent = (event: KeyboardEvent, down: boolean) => {
			if (event.repeat) return;

			if (isKey(DOWN_KEYS, event)) {
				this.inputMoveDown = down;
			} else if (isKey(UP_KEYS, event)) {
				this.inputMoveUp = down;
			} else return;

			this.updatePaddleMovement();
		};

		window.addEventListener("keydown", (event) => handleEvent(event, true));
		window.addEventListener("keyup", (event) => handleEvent(event, false));
	}

	private _isGameActive = false;
	private _selfScore: number = 0;
	private _oppScore: number = 0;

	private gamemode: DefaultGamemode | undefined = undefined;

	private inputMoveDown = false;
	private inputMoveUp = false;

	private isCheckingWin = false;
	private botDifficulty = BotDifficulty.Easy;
}

function isKey(keyArray: Array<string>, event: KeyboardEvent): boolean {
	return keyArray.find((key) => key === event.key) !== undefined;
}
