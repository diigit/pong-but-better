use hecs::World;

use crate::{
	movement::Precision,
    utils::Command,
};

pub struct ExampleEntitySystem;

impl ExampleEntitySystem {
    pub fn create(world: &mut World) { }
    pub fn exec_cmd(world: &mut World, command: &Command) { }
    pub fn run(world: &mut World, delta_time: Precision) { }
}