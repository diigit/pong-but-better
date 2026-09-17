use deref::DerefMut;
use specs::{prelude::*, Component};
use wasm_bindgen::prelude::wasm_bindgen;

use crate::physics::{
    create_moving_entity, Acceleration, Bounds, Mass, Position, Precision, Velocity,
};

#[derive(Debug, Component)]
#[storage(NullStorage)]
pub struct PlayerControlled;

#[derive(Debug, Component)]
#[storage(NullStorage)]
pub struct BotControlled;

#[derive(Debug, Component)]
#[storage(NullStorage)]
pub struct Ball;

#[derive(Debug, Component, DerefMut)]
#[storage(HashMapStorage)]
pub struct PlayerVerticalVelocity(#[auto_ref] pub Precision);

#[derive(Debug, Clone, Copy)]
#[wasm_bindgen]
pub enum GameDifficulty {
    Easy,
    Medium,
    Hard,
}

#[derive(Debug)]
#[wasm_bindgen]
pub struct GameSettings {
    pub difficulty: GameDifficulty,
    pub canvas_size_x: Precision,
    pub canvas_size_y: Precision,
}

#[derive(Debug)]
pub struct BotController;

impl<'a> System<'a> for BotController {
    type SystemData = (
        ReadStorage<'a, BotControlled>,
        WriteStorage<'a, Velocity>,
        ReadStorage<'a, Position>,
        ReadStorage<'a, Ball>,
    );

    fn run(&mut self, (bot_controlled, mut velocity, position, ball): Self::SystemData) {}

    fn setup(&mut self, world: &mut World) {
        let entity = create_moving_entity(
            world,
            Position::default(),
            Velocity::default(),
            Acceleration::default(),
            Bounds::default(),
            Mass::default(),
        );
    }
}

#[derive(Debug)]
pub struct PlayerController;

impl<'a> System<'a> for PlayerController {
    type SystemData = (
        ReadStorage<'a, PlayerControlled>,
        WriteStorage<'a, Velocity>,
        ReadStorage<'a, PlayerVerticalVelocity>,
    );

    fn run(&mut self, (player_controlled, mut velocity, player_vel): Self::SystemData) {}

    fn setup(&mut self, world: &mut World) {}
}
