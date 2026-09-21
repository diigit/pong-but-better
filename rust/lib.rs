mod collisions;
mod movement;
mod objects;
mod shapes;
mod triangulation;
mod utils;

use hecs::World;
use std::{
    sync::mpsc::{self, Receiver},
    time::Instant,
};
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::console_log;

use crate::triangulation::TriangulationSystem;

#[wasm_bindgen]
pub struct CanvasSize {
    x: f32,
    y: f32,
}

#[wasm_bindgen]
pub enum Command {
    SetPaused(bool),
    SetPlayerVelocity(f32),
    SetCanvasSize(CanvasSize),
}

#[wasm_bindgen]
pub struct GameController {
    transmitter: mpsc::Sender<Command>,
}

#[wasm_bindgen]
impl GameController {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel::<Command>();

        Self::run_rx(rx);

        Self { transmitter: tx }
    }

    pub fn send_command(&self, command: Command) {
        self.transmitter.send(command).unwrap();
    }

    fn run_rx(rx: Receiver<Command>) {
        let mut world = World::new();

        let performance = web_sys::window().unwrap().performance().unwrap();
        let mut triangulation_sys = TriangulationSystem::default();

        let _ = objects::PlayerPaddleSystem::create(&mut world);
        let _ = objects::BotPaddleSystem::create(&mut world);
        let _ = objects::BallSystem::create(&mut world);

        let mut time_last = performance.now();
        loop {
            let time_now = performance.now();
            let time_delta = (time_now - time_last) as f32;
            time_last = time_now;

            for cmd in rx.try_iter() {
                objects::execute_command(&mut world, cmd);
            }

            movement::run_movement(&mut world, time_delta);
            collisions::run_collisions(&mut world);
            objects::run_objects(&mut world, time_delta);
            triangulation_sys.run_triangulation(&mut world);
        }
    }
}

#[wasm_bindgen]
extern "C" {
    fn send_vertices(ptr: *const f32, len: usize);
}

#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    Ok(())
}
