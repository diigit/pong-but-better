use hecs::World;
use std::{cell::RefCell, default, rc::Rc};
use wasm_bindgen::prelude::*;
use web_sys::{
    DedicatedWorkerGlobalScope,
    js_sys::{self, SharedArrayBuffer},
};

use crate::{
    collisions, extended_entities,
    movement,
    triangulation::TriangulationSystem,
    utils::*,
};

const FRAMES_PER_STEP: usize = 25_000_000; // Arbitrary number just cus it runs too quick

#[wasm_bindgen]
pub fn run_within_worker(buffer: SharedArrayBuffer, canvas_size: CanvasSize) {
    let global = js_sys::global().unchecked_into::<DedicatedWorkerGlobalScope>();
    let performance = global
        .performance()
        .expect("Unabled to find performance object in worker.");

    let command_buf_ref: Rc<RefCell<Vec<Command>>> = Rc::new(RefCell::new(Vec::new()));

    {
        let command_buf_ref = Rc::clone(&command_buf_ref);
        let message_handler: Closure<dyn FnMut(Command)> = Closure::new(move |cmd| {
            let mut command_buf = command_buf_ref.borrow_mut();
            command_buf.push(cmd);
        });

        global.set_onmessage(Some(message_handler.as_ref().unchecked_ref()));

        message_handler.forget();
    }

    let mut world = World::new();

    let mut triangulation_sys = TriangulationSystem::new(&buffer, canvas_size);

    let _ = extended_entities::PlayerPaddleSystem::create(&mut world);
    let _ = extended_entities::BotPaddleSystem::create(&mut world);
    let _ = extended_entities::BallSystem::create(&mut world);

    let mut frames_since_last_render = 0;

    let mut time_last = performance.now();
    loop {
        if frames_since_last_render == FRAMES_PER_STEP {
            frames_since_last_render = 0;
            
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

        frames_since_last_render += 1;
    }
}
