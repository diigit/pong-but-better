use core::f32;

use hecs::World;
use nalgebra::{point, vector};

use crate::{
    collisions::*,
    constants::{
        self, CANVAS_HEIGHT, CANVAS_PADDLE_PADDING, CANVAS_WIDTH, PADDLE_SIZE_X, PADDLE_SIZE_Y,
    },
    extended_entities::ExtendedEntityType,
    movement::*,
    utils::Command,
};

pub struct BotPaddleSystem;

impl BotPaddleSystem {
    pub fn create(world: &mut World) {
        let entity = spawn_collidable(
            world,
            Position(point![
                CANVAS_WIDTH - CANVAS_PADDLE_PADDING - PADDLE_SIZE_X,
                CANVAS_HEIGHT / 2.0 - PADDLE_SIZE_Y / 2.0,
            ]),
            Velocity::default(),
            Acceleration::default(),
            Bounds(vector![constants::PADDLE_SIZE_X, constants::PADDLE_SIZE_Y]),
            Mass::anchored(),
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
