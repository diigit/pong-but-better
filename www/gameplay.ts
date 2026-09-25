import { CanvasSize, GameController } from "../pkg/pong_but_better";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";

GameController.run_within_worker(CanvasSize.new(CANVAS_WIDTH, CANVAS_HEIGHT));
