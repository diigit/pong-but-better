use hecs::World;

use crate::{
    movement::*, utils::Command,
};

pub struct BallSystem;
impl BallSystem {
    pub fn create(_: &mut World) {}

    pub fn exec_cmd(_: &mut World, cmd: &Command) {
        match cmd {

            _ => {}
        }
    }

    pub fn run(_: &mut World, _: Precision) {}
}
