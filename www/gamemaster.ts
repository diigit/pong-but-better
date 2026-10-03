import { Ctx, Evt } from "evt";
import {
	BORDER_THICKNESS,
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	DEFAULT_PADDLE_HEIGHT,
	DEFAULT_PADDLE_WIDTH,
	DEFAULT_WINNING_SCORE,
} from "./constants";
import { Middleman } from "../pkg/pong_but_better";
import { EntityTracker } from "./entity_tracker";
import { BotPaddle, Paddle } from "./entities/paddle";
import { Entity, Mass } from "./entities";
import { point, vector } from "2d-geometry";
import { DefaultGamemode } from "./gamemodes/default";

export enum Gamemode {
	Normal,
	ManyBalls,
	Obstacles,
	ExplodeYourPC,
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
	public readonly gamemodeChanged = Evt.create<Gamemode>();
	public readonly botDifficultyChanged = Evt.create<BotDifficulty>();

	public winningScore = DEFAULT_WINNING_SCORE;

	private constructor(
		public readonly entityTracker: EntityTracker,
		public readonly playerPaddle: Paddle,
		public readonly botPaddle: Paddle,
		public readonly leftBoundary: Entity,
		public readonly rightBoundary: Entity,
	) {}

	static async create(worker: Worker, buffer: SharedArrayBuffer): Promise<Gamemaster> {
		let middleman = Middleman.new(worker);
		let entityTracker = new EntityTracker(worker, middleman, buffer);

		let upperBoundary = await entityTracker.createEntity(Entity);
		upperBoundary.position = point(0, CANVAS_HEIGHT);
		upperBoundary.bounds = vector(CANVAS_WIDTH, BORDER_THICKNESS);
		upperBoundary.mass = new Mass(true, 0);

		let lowerBoundary = await entityTracker.createEntity(Entity);
		lowerBoundary.position = point(0, -BORDER_THICKNESS);
		lowerBoundary.bounds = vector(CANVAS_WIDTH, BORDER_THICKNESS);
		lowerBoundary.mass = new Mass(true, 0);

		let leftBoundary = await entityTracker.createEntity(Entity);
		leftBoundary.position = point(-BORDER_THICKNESS, 0);
		leftBoundary.bounds = vector(BORDER_THICKNESS, CANVAS_HEIGHT);
		leftBoundary.mass = new Mass(true, 0);

		let rightBoundary = await entityTracker.createEntity(Entity);
		rightBoundary.position = point(CANVAS_WIDTH, 0);
		rightBoundary.bounds = vector(BORDER_THICKNESS, CANVAS_HEIGHT);
		rightBoundary.mass = new Mass(true, 0);

		let botPaddle = await entityTracker.createEntity(BotPaddle);
		botPaddle.position = point(
			CANVAS_WIDTH - DEFAULT_PADDLE_WIDTH,
			CANVAS_HEIGHT / 2 - DEFAULT_PADDLE_HEIGHT / 2,
		);

		let playerPaddle = await entityTracker.createEntity(Paddle);
		playerPaddle.position = point(0, CANVAS_HEIGHT / 2 - DEFAULT_PADDLE_HEIGHT / 2);

		return new Gamemaster(entityTracker, playerPaddle, botPaddle, leftBoundary, rightBoundary);
	}

	async start() {
		this._gamemode = await DefaultGamemode.create(this);
		this.isGameActive = true;
	}

	async end() {
		this._gamemode?.destroy();
		this.isGameActive = false;
	}

	resetBall() {}

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
		this.resetBall();
	}

	get oppScore(): number {
		return this._oppScore;
	}

	set oppScore(score: number) {
		this._oppScore = score;
		this.oppScoreChanged.post(score);
		this.resetBall();
	}

	get gamemode() {
		//return this._gamemode !== undefined ? this._gamemode.type : Gamemode.Normal;
		return Gamemode.Normal;
	}

	set gamemode(newGamemode: Gamemode) {
		//if (
		//(newGamemode === Gamemode.Normal && this._gamemode === undefined) ||
		//newGamemode === this._gamemode?.type
		//)
		//return;

		this.selfScore = 0;
		this.oppScore = 0;

		this.end().catch(console.error);
		//this._gamemode?.cleanUp();

		//let gamemodeHandler;
		switch (newGamemode) {
			case Gamemode.ManyBalls:
				//gamemodeHandler = new ManyBallsGamemode(this);
				break;
			case Gamemode.Obstacles:
				//gamemodeHandler = new ObstaclesGamemode(this);
				break;
			case Gamemode.ExplodeYourPC:
				//gamemodeHandler = new ExplodeYourPCGamemode(this);
				break;
		}

		//this._gamemode = gamemodeHandler;
		this.gamemodeChanged.post(newGamemode);
	}

	get botDifficulty() {
		return this._botDifficulty;
	}

	set botDifficulty(newBotDifficulty: BotDifficulty) {
		this._botDifficulty = newBotDifficulty;
		this.botDifficultyChanged.post(newBotDifficulty);
	}

	private createInputListeners() {
		window.addEventListener("keydown", (event) => {});

		window.addEventListener("keyup", (event) => {});
	}

	private inputCtx = new Ctx();

	private _isGameActive = false;
	private _selfScore: number = 0;
	private _oppScore: number = 0;
	//private _gamemode: GamemodeHandler | undefined;
	private _botDifficulty = BotDifficulty.Easy;

	private _gamemode: DefaultGamemode | undefined = undefined;
}
