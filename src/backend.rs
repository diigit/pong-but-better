use specs::prelude::*;
use std::{sync::{Arc, mpsc}, thread, time::Instant};
use wasm_bindgen::prelude::wasm_bindgen;
use web_sys::js_sys::{self, Null};

use crate::{
    physics::{Collisions, Movement, TimeDelta}, vertices::Tessellation,
};

#[wasm_bindgen]
pub enum Command {
    Start(js_sys::Null),
    Pause(js_sys::Null),
    Reset(js_sys::Null),

    SetPlayerVelocity(f32),
}

#[wasm_bindgen]
pub struct Backend {
    transmitter: mpsc::Sender<Command>,
}

#[wasm_bindgen]
impl Backend {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel::<Command>();

        let _handle = thread::spawn(move || {
            let mut world = World::new();
            
            let mut dispatcher = DispatcherBuilder::new()
                .with(Movement, "movement", &[])
                .with(Collisions, "collisions", &["movement"])
                .with_thread_local(Tessellation)
                .build();

            dispatcher.setup(&mut world);

            let mut time_last = Instant::now();

            loop {
                let time_now = Instant::now();
                let time_delta = (time_now - time_last).as_secs_f32();
                time_last = time_now;
                
                for cmd in rx.try_iter() {
                    todo!();
                }

                *world.write_resource::<TimeDelta>() = TimeDelta(time_delta);
                dispatcher.dispatch(&world);
            }
        });

        Self { transmitter: tx }
    }

    pub fn send_command(&self, command: Command) {
        self.transmitter.send(command).unwrap();
    }
}
