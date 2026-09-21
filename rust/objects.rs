// TODO: This can use macros!

use hecs::{Entity, World};

use crate::{Command, movement::*, collisions::Anchored};

pub struct PlayerPaddle;

pub struct PlayerPaddleSystem;
impl PlayerPaddleSystem {
    pub fn create(world: &mut World) -> Entity {
		world.spawn(())
	}

	pub fn exec_cmd(world: &mut World, command: &Command) {}

    pub fn run(world: &mut World, time_delta: Precision) {}
}

pub struct BotPaddle;

pub struct BotPaddleSystem;
impl BotPaddleSystem {
    pub fn create(world: &mut World) -> Entity {
		world.spawn(())
	}

	pub fn exec_cmd(world: &mut World, command: &Command) {}

    pub fn run(world: &mut World, time_delta: Precision) {}
}

pub struct Ball;

pub struct BallSystem;
impl BallSystem {
    pub fn create(world: &mut World) -> Entity {
		world.spawn(())	
	}

	pub fn exec_cmd(world: &mut World, command: &Command) {}

    pub fn run(world: &mut World, time_delta: Precision) {}
}

pub fn run_objects(world: &mut World, time_delta: Precision) {
    PlayerPaddleSystem::run(world, time_delta);
    BotPaddleSystem::run(world, time_delta);
    BallSystem::run(world, time_delta);
}

pub fn execute_command(world: &mut World, command: Command) {
    PlayerPaddleSystem::exec_cmd(world, &command);
    BotPaddleSystem::exec_cmd(world, &command);
    BallSystem::exec_cmd(world, &command);
}
