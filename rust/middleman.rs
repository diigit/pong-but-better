use wasm_bindgen::prelude::*;
use web_sys::Worker;

use crate::{
    constants::{CANVAS_HEIGHT, CANVAS_WIDTH},
    utils::{BallSpawnArgs, Command},
};

#[wasm_bindgen]
pub struct Middleman {
    worker: Worker,
}

#[wasm_bindgen]
impl Middleman {
    pub fn new(worker: Worker) -> Self {
        Self { worker }
    }

    pub fn spawn_balls(&self, count: usize) {
        let command = Command::SpawnBall(BallSpawnArgs {
            count,
            x: CANVAS_WIDTH / 2.0,
            y: CANVAS_HEIGHT / 2.0,
        });

        self.worker
            .post_message(&serde_wasm_bindgen::to_value(&command).unwrap())
            .unwrap()
    }

    pub fn start_balls(&self) {
        self.send_command(Command::StartBalls)
    }

    fn send_command(&self, command: Command) {
        self.worker
            .post_message(&serde_wasm_bindgen::to_value(&command).unwrap())
            .unwrap()
    }
}
