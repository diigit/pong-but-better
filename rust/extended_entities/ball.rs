use core::f32;

use hecs::{CommandBuffer, Entity, World};
use nalgebra::{point, vector};
use web_sys::js_sys::Math;

use crate::{
    collisions::*, constants::{self, BALL_SIDE_LENGTH}, extended_entities::ExtendedEntityType, movement::*, shapes::Shape, utils::Command,
};

pub struct BallSystem;
impl BallSystem {
    pub fn create(_: &mut World) {}

    pub fn exec_cmd(world: &mut World, cmd: &Command) {
        match cmd {
            Command::SpawnBall(args) => {
                let spawn_iter = (0..args.count).map(|_| {
                    (
                        Position(point![
                            args.x + (Math::random() - 0.5) as f32,
                            args.y + (Math::random() - 0.5) as f32
                        ]),
                        Velocity::default(),
                        Acceleration::default(),
                        Mass::anchored(),
                        Bounds(vector![BALL_SIDE_LENGTH, BALL_SIDE_LENGTH]),
                        Shape::AxisAlignedBox,
                        IgnoreCollisions,
                        ExtendedEntityType::Ball,
                    )
                });

                world.spawn_batch(spawn_iter);
            }

            Command::StartBalls => {
                let mut buf = CommandBuffer::new();

                for (entity, entity_type, velocity, mass, _) in world.query_mut::<(
                    Entity,
                    &ExtendedEntityType,
                    &mut Velocity,
                    &mut Mass,
                    &IgnoreCollisions,
                )>() {
                    if let ExtendedEntityType::Ball = entity_type {
                        buf.remove_one::<IgnoreCollisions>(entity);

                        *mass = Mass(1.0);
                        *velocity = Velocity(vector![-constants::BALL_SPEED, 0.0])
                    }
                }

                buf.run_on(world);
            }

            Command::RemoveAllBalls => {
                let mut buf = CommandBuffer::new();

                for (entity, entity_type) in world.query_mut::<(Entity, &ExtendedEntityType)>() {
                    if let ExtendedEntityType::Ball = entity_type {
                        buf.despawn(entity);
                    }
                }

                buf.run_on(world);
            }

            _ => {}
        }
    }

    pub fn run(_: &mut World, _: Precision) {}
}
