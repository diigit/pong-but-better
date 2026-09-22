mod collisions;
mod extended_entities;
mod movement;
mod shapes;
mod triangulation;
mod utils;

use hecs::World;
use std::{
    cell::{Cell, RefCell},
    rc::Rc,
    sync::{
        Mutex, RwLock,
        mpsc::{self, Receiver},
    },
};
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::{__rt::worker, console_log};
use web_sys::{
    DedicatedWorkerGlobalScope, Worker,
    js_sys::{self, Undefined},
};

use crate::triangulation::TriangulationSystem;

#[wasm_bindgen]
#[derive(Clone)]
pub struct CanvasSize {
    x: f32,
    y: f32,
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct BallSpawnArgs {
    count: usize,
    x: f32,
    y: f32,
}

#[wasm_bindgen]
#[derive(Clone)]
pub enum Command {
    SetPaused(bool),
    SetPlayerVelocity(f32),
    SetBotMaxSpeed(f32),
    SetBotFutureSight(f32),
    SetCanvasSize(CanvasSize),
    SpawnBall(BallSpawnArgs),
    RemoveAllBalls(Undefined),
    StartBalls(Undefined),
}

#[wasm_bindgen]
#[derive(Default, Clone, Copy)]
pub struct VertexBufferPtr {
    pub ptr: *const f32,
    pub len: usize,
}

#[wasm_bindgen]
pub struct GameController {
    worker: Worker,
}

#[wasm_bindgen]
impl GameController {
    pub fn new(worker: Worker) -> Self {
        Self { worker }
    }

    fn run_within_worker() {
        let global = js_sys::global().unchecked_into::<DedicatedWorkerGlobalScope>();

        let command_buf_ref: Rc<RefCell<Vec<Command>>> = Rc::new(RefCell::new(Vec::new()));

        let msg_handler_ref = Rc::clone(&command_buf_ref);
        let message_handler: Closure<dyn FnMut(Command)> = Closure::new(move |cmd| {
            let mut command_buf = msg_handler_ref.borrow_mut();
            command_buf.push(cmd);
        });

        global.set_onmessage(Some(message_handler.as_ref().unchecked_ref()));

        message_handler.forget();

        let mut world = World::new();

        let performance = global
            .performance()
            .expect("Unabled to find performance object in worker.");
        let mut triangulation_sys = TriangulationSystem::new();

        let _ = extended_entities::PlayerPaddleSystem::create(&mut world);
        let _ = extended_entities::BotPaddleSystem::create(&mut world);
        let _ = extended_entities::BallSystem::create(&mut world);

        let mut time_last = performance.now();
        loop {
            let time_now = performance.now();
            let time_delta = ((time_now - time_last) / 1000.0) as f32;
            time_last = time_now;

            if let Ok(command_buf) = command_buf_ref.try_borrow() {
                for cmd in command_buf.iter() {
                    extended_entities::execute_command(&mut world, cmd);
                }
            }

            movement::run_movement(&mut world, time_delta);
            collisions::run_collisions(&mut world);
            extended_entities::run_objects(&mut world, time_delta);
            triangulation_sys.run_triangulation(&mut world);
        }
    }
}

#[wasm_bindgen]
extern "C" {
    fn set_vertex_buffer(ptr: *const f32, len: usize);
}

#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    Ok(())
}

#[wasm_bindgen]
pub fn setup_game_controller(worker: Worker) -> GameController {
    let game_controller = GameController::new(worker);

    game_controller
}
