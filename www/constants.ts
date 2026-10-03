export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 384;

export const MAX_VERTICES = 128;
export const MAX_ENTITIES = MAX_VERTICES / 4;
export const ENTITY_SIZE_BYTES = 64;
export const BORDER_THICKNESS = 250;

export const DOWN_KEYS = ["ArrowDown", "s"];
export const UP_KEYS = ["ArrowUp", "w"];

export const PADDLE_BALL_SKEW = 250;
export const PADDLE_BALL_FRICTION = .4;
export const BALL_SPEED_INCREASE = 1.05;

export const PADDLE_WIDTH = 16;
export const PADDLE_HEIGHT = 64;
export const PADDLE_EDGE_MARGIN = 0;

export const PADDLE_MOVE_SPEED = 400;
export const BALL_SPEED = 700;
export const BALL_SIZE = 16;
export const WINNING_SCORE = 3;
export const BALL_MASS = 5;

export const BALL_WAIT_TIME = 1; // seconds

export const BOT_DIFFICULTY = {
	EASY: { POLLING_RATE: 4, PREDICT_DISTANCE: 60, PADDLE_MOVE_SPEED: 320 },
	MEDIUM: { POLLING_RATE: 7, PREDICT_DISTANCE: 125, PADDLE_MOVE_SPEED: 400 },
	HARD: { POLLING_RATE: 11, PREDICT_DISTANCE: 225, PADDLE_MOVE_SPEED: 550 },
};
