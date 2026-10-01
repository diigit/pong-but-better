pub mod bot_paddle;
pub mod ball;
pub mod player_paddle;
pub mod borders;

use hecs::World;
use player_paddle::PlayerPaddleSystem;
use bot_paddle::BotPaddleSystem;
use ball::BallSystem;

use crate::{extended_entities::borders::BorderSystem, movement::Precision, utils::Command};

pub enum ExtendedEntityType {
    PlayerPaddle,
    BotPaddle { max_speed: f32, future_sight: f32 },
    Ball,
}

pub fn create_all(world: &mut World) {
	let _ = BorderSystem::create(world);
    let _ = PlayerPaddleSystem::create(world);
    let _ = BotPaddleSystem::create(world);
    let _ = BallSystem::create(world);
}

pub fn run_all(world: &mut World, time_delta: Precision) {
    PlayerPaddleSystem::run(world, time_delta);
    BotPaddleSystem::run(world, time_delta);
    BallSystem::run(world, time_delta);
}

pub fn execute_command(world: &mut World, command: &Command) {
    PlayerPaddleSystem::exec_cmd(world, command);
    BotPaddleSystem::exec_cmd(world, command);
    BallSystem::exec_cmd(world, command);
}