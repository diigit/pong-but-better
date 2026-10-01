use hecs::World;
use nalgebra::{point, vector};

use crate::{
    collisions::*,
    constants::{CANVAS_HEIGHT, CANVAS_PADDLE_PADDING, PADDLE_SIZE_Y},
    extended_entities::ExtendedEntityType,
    movement::*,
    utils::Command,
};

pub struct PlayerPaddleSystem;
impl PlayerPaddleSystem {
    pub fn create(world: &mut World) {
        let entity = spawn_collidable(
            world,
            Position(point![
                CANVAS_PADDLE_PADDING,
                CANVAS_HEIGHT / 2.0 - PADDLE_SIZE_Y / 2.0,
            ]),
            Velocity::default(),
            Acceleration::default(),
            Bounds(vector![PADDLE_SIZE_Y, PADDLE_SIZE_Y]),
            Mass::anchored(),
        );

        world
            .insert_one(entity, ExtendedEntityType::PlayerPaddle)
            .unwrap();
    }

    pub fn exec_cmd(_: &mut World, command: &Command) {
        match command {

            _ => (),
        }
    }

    pub fn run(_: &mut World, _: Precision) {
        // TODO
    }
}
