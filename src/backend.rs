use specs::prelude::*;
use std::{sync::mpsc, thread, time::Instant};
use wasm_bindgen::prelude::wasm_bindgen;

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
pub struct Backend {
    transmitter: mpsc::Sender<Command>,
}

#[wasm_bindgen]
impl Backend {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel::<Command>();

        let _handle = thread::spawn(move || {
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
                let time_now = Instant::now();
                let time_delta = (time_now - time_last).as_secs_f32();
                time_last = time_now;

                for cmd in rx.try_iter() {
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
        });

        Self { transmitter: tx }
    }

    pub fn send_command(&self, command: Command) {
        self.transmitter.send(command).unwrap();
    }
}
