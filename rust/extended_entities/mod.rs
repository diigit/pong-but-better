pub mod bot_paddle;
pub mod ball;
pub mod player_paddle;

use hecs::World;
use player_paddle::PlayerPaddleSystem;
use bot_paddle::BotPaddleSystem;
use ball::BallSystem;

use crate::{movement::Precision, utils::Command};

pub enum ExtendedEntityType {
    PlayerPaddle,
    BotPaddle { max_speed: f32, future_sight: f32 },
    Ball,
}

pub fn run_objects(world: &mut World, time_delta: Precision) {
    PlayerPaddleSystem::run(world, time_delta);
    BotPaddleSystem::run(world, time_delta);
    BallSystem::run(world, time_delta);
}

pub fn execute_command(world: &mut World, command: &Command) {
    PlayerPaddleSystem::exec_cmd(world, command);
    BotPaddleSystem::exec_cmd(world, command);
    BallSystem::exec_cmd(world, command);
}