mod interactables;
mod physics;
mod shapes;
mod utils;
mod vertices;

use specs::prelude::*;
use std::{sync::mpsc, time::Instant};
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::console_log;

use crate::{
    interactables::{
        BotController, GameDifficulty, GameSettings, PlayerController, PlayerVerticalVelocity,
    },
    physics::{Collisions, Movement, TimeDelta},
    vertices::Tessellation,
};

#[wasm_bindgen]
pub enum Command {
    SetSettings(GameSettings),
    SetPlayerVelocity(f32),
}

#[wasm_bindgen]
pub struct GameController {
    transmitter: mpsc::Sender<Command>,
    reciever: mpsc::Receiver<Command>,
}

#[wasm_bindgen]
impl GameController {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel::<Command>();

        Self { transmitter: tx, reciever: rx }
    }

    pub fn send_command(&self, command: Command) {
        self.transmitter.send(command).unwrap();
    }

    pub fn run(&self) {
        let mut world = World::new();
        world.insert::<GameSettings>(GameSettings {
            difficulty: GameDifficulty::Easy,
            canvas_size_x: 0.0,
            canvas_size_y: 0.0,
        });
        world.insert::<PlayerVerticalVelocity>(PlayerVerticalVelocity(0.0));
        world.insert::<TimeDelta>(TimeDelta(0.0));

        let mut dispatcher = DispatcherBuilder::new()
            .with(Movement, "movement", &[])
            .with(Collisions, "collisions", &["movement"])
            .with(BotController, "bot controls", &["movement"])
            .with(PlayerController, "player controls", &["movement"])
            .with_thread_local(Tessellation)
            .build();

        dispatcher.setup(&mut world);

        let mut time_last = Instant::now();
        loop {
            console_log!("Hello!");

            let time_now = Instant::now();
            let time_delta = (time_now - time_last).as_secs_f32();
            time_last = time_now;

            for cmd in self.reciever.try_iter() {
                match cmd {
                    Command::SetPlayerVelocity(new_velocity) => {
                        *world.write_resource::<PlayerVerticalVelocity>() =
                            PlayerVerticalVelocity(new_velocity);
                    }

                    Command::SetSettings(settings) => {
                        *world.write_resource::<GameSettings>() = settings;
                    }
                }
            }

            *world.write_resource::<TimeDelta>() = TimeDelta(time_delta);
            dispatcher.dispatch(&world);
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
