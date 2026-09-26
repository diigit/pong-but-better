// TODO: This can use macros!

// TODO: Make a object type component that's an enum

use core::f32;

use hecs::{CommandBuffer, Entity, World};
use nalgebra::{point, vector};

use crate::{collisions::*, movement::*, shapes::Shape, utils::Command};

const PADDLE_RELATIVE_SIZE_X: Precision = 0.1;
const PADDLE_RELATIVE_SIZE_Y: Precision = 0.3;
const CANVAS_PADDLE_PADDING: Precision = 10.0;
const BALL_SIZE: Precision = 10.0;

pub enum ExtendedEntityType {
    PlayerPaddle,
    BotPaddle { max_speed: f32, future_sight: f32 },
    Ball,
}

pub struct PlayerPaddleSystem;
impl PlayerPaddleSystem {
    pub fn create(world: &mut World) {
        let entity = spawn_collidable(
            world,
            Position::default(),
            Velocity::default(),
            Bounds::default(),
            Mass(f32::MAX),
        );

        world
            .insert_one(entity, ExtendedEntityType::PlayerPaddle)
            .unwrap();
    }

    pub fn exec_cmd(world: &mut World, command: &Command) {
        match command {
            Command::SetCanvasSize(size) => {
                for (position, bounds, entity_type) in
                    world.query_mut::<(&mut Position, &mut Bounds, &ExtendedEntityType)>()
                {
                    if let ExtendedEntityType::PlayerPaddle = entity_type {
                        let new_bounds = vector![
                            size.x * PADDLE_RELATIVE_SIZE_X,
                            size.y * PADDLE_RELATIVE_SIZE_Y
                        ];
                        let x_pos = CANVAS_PADDLE_PADDING;
                        let y_pos = size.y / 2.0 - new_bounds.y / 2.0;

                        *position = Position(point![x_pos, y_pos]);
                        *bounds = Bounds(new_bounds);
                    }
                }
            }

            Command::SetPlayerVelocity(new_velocity) => {
                for (velocity, entity_type) in
                    world.query_mut::<(&mut Velocity, &ExtendedEntityType)>()
                {
                    if let ExtendedEntityType::PlayerPaddle = entity_type {
                        *velocity = Velocity(vector![velocity.x, *new_velocity]);
                    }
                }
            }

            _ => (),
        }
    }

    pub fn run(_: &mut World, _: Precision) {
        // TODO
    }
}

pub struct BotPaddleSystem;

impl BotPaddleSystem {
    pub fn create(world: &mut World) {
        let entity = spawn_collidable(
            world,
            Position::default(),
            Velocity::default(),
            Bounds::default(),
            Mass(f32::MAX),
        );

        world
            .insert_one(
                entity,
                ExtendedEntityType::BotPaddle {
                    max_speed: 0.0,
                    future_sight: 0.0,
                },
            )
            .unwrap();
    }

    pub fn exec_cmd(world: &mut World, command: &Command) {
        match command {
            Command::SetBotMaxSpeed(_) | Command::SetBotFutureSight(_) => {
                for entity_type in world.query_mut::<&mut ExtendedEntityType>() {
                    if let ExtendedEntityType::BotPaddle {
                        max_speed,
                        future_sight,
                    } = entity_type
                    {
                        if let Command::SetBotMaxSpeed(speed) = command {
                            *max_speed = *speed;
                        } else if let Command::SetBotFutureSight(time) = command {
                            *future_sight = *time;
                        };
                    }
                }
            }

            Command::SetCanvasSize(size) => {
                for (entity_type, position, bounds) in
                    world.query_mut::<(&mut ExtendedEntityType, &mut Position, &mut Bounds)>()
                {
                    if let ExtendedEntityType::BotPaddle { .. } = entity_type {
                        let new_bounds = vector![
                            size.x * PADDLE_RELATIVE_SIZE_X,
                            size.y * PADDLE_RELATIVE_SIZE_Y
                        ];
                        let x_pos = size.x - CANVAS_PADDLE_PADDING - new_bounds.x;
                        let y_pos = size.y / 2.0 - new_bounds.y / 2.0;

                        *position = Position(point![x_pos, y_pos]);
                        *bounds = Bounds(new_bounds);
                    }
                }
            }

            _ => {}
        }
    }

    pub fn run(world: &mut World, _: Precision) {
        let mut balls: Vec<(Precision, Precision, Precision)> = Vec::new();

        for (entity_type, ball_pos, ball_vel) in
            world.query_mut::<(&ExtendedEntityType, &Position, &Velocity)>()
        {
            if let ExtendedEntityType::Ball = entity_type {
                balls.push((ball_pos.x, ball_vel.x, ball_pos.y));
            }
        }

        if balls.len() == 0 {
            return;
        }

        for (paddle_entity_type, paddle_pos, paddle_vel) in
            world.query_mut::<(&ExtendedEntityType, &Position, &mut Velocity)>()
        {
            if let ExtendedEntityType::BotPaddle {
                max_speed,
                future_sight,
            } = paddle_entity_type
            {
                let mut closest_x: f32 = f32::MAX;
                let mut target_y: f32 = 0.0;

                balls.iter().for_each(|(xpos, vel, ypos)| {
                    let x = xpos + vel * future_sight;

                    if closest_x < x {
                        closest_x = x;
                        target_y = *ypos;
                    }
                });

                let dist = target_y - paddle_pos.y;
                let paddle_y_vel = dist.signum() * max_speed;

                *paddle_vel = Velocity(vector![paddle_vel.x, paddle_y_vel]);
            }
        }
    }
}

pub struct BallSystem;
impl BallSystem {
    pub fn create(_: &mut World) {}

    pub fn exec_cmd(world: &mut World, cmd: &Command) {
        match cmd {
            Command::SpawnBall(args) => {
                let spawn_iter = (0..args.count).map(|_| {
                    (
                        Position(point![args.x, args.y]),
                        Velocity::default(),
                        Acceleration::default(),
                        Mass(f32::MAX),
                        Bounds(vector![BALL_SIZE, BALL_SIZE]),
                        Shape::AxisAlignedBox,
                        IgnoreCollisions,
                        ExtendedEntityType::Ball,
                    )
                });

                world.spawn_batch(spawn_iter);
            }

            Command::StartBalls(_) => {
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
                        *velocity = Velocity(vector![-5.0, 0.0])
                    }
                }

                buf.run_on(world);
            }

            Command::RemoveAllBalls(_) => {
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
