use hecs::World;
use std::{cell::RefCell, rc::Rc};
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::console_log;
use web_sys::{
    DedicatedWorkerGlobalScope, MessageEvent, Worker,
    js_sys::{self, Promise, SharedArrayBuffer},
};

use crate::{
    collisions,
    constants::{CANVAS_HEIGHT, CANVAS_WIDTH, SIMULATION_STEP_RATE},
    extended_entities, movement, setInterval,
    triangulation::TriangulationSystem,
    utils::*,
};

#[wasm_bindgen]
pub async fn run_within_worker(vertex_buffer: SharedArrayBuffer, index_buffer: SharedArrayBuffer) {
    let global = js_sys::global().unchecked_into::<DedicatedWorkerGlobalScope>();
    let performance = global
        .performance()
        .expect("Unabled to find performance object in worker.");

    let command_buf_ref: Rc<RefCell<Vec<Command>>> = Rc::new(RefCell::new(Vec::new()));

    {
        let command_buf_ref = Rc::clone(&command_buf_ref);
        let message_handler: Closure<dyn FnMut(MessageEvent)> =
            Closure::new(move |event: MessageEvent| {
                let cmd: Command = serde_wasm_bindgen::from_value(event.data()).unwrap();
                command_buf_ref.borrow_mut().push(cmd);
            });

        global.set_onmessage(Some(message_handler.as_ref().unchecked_ref()));

        message_handler.forget();
    }

    let mut world = World::new();

    let mut triangulation_sys = TriangulationSystem::new(&vertex_buffer, &index_buffer);

    let _ = extended_entities::PlayerPaddleSystem::create(&mut world);
    let _ = extended_entities::BotPaddleSystem::create(&mut world);
    let _ = extended_entities::BallSystem::create(&mut world);

    let mut time_last = performance.now();

    let gameplay_loop = move || {
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
    };

    let closure = Closure::new(gameplay_loop);

    let a = Promise::new(&mut |_, _| {
        setInterval(&closure, (1000.0 / SIMULATION_STEP_RATE) as u32); // two constants, never gonna be negative probably
    });

    a.await.unwrap();

    closure.forget();
}

#[wasm_bindgen]
pub struct GameplayCommunicator {
    worker: Worker,
}

#[wasm_bindgen]
impl GameplayCommunicator {
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
}
