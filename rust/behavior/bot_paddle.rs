use core::f32;

use hecs::Entity;
use nalgebra::vector;

use crate::{
    behavior::Behavior,
    entity_tracker::EntityType,
    movement::{Position, Velocity},
};

const MAX_SPEED: f32 = 400.0;
const PREDICTION_SECS: f32 = 0.3;
const PADDLE_SIZE_Y: f32 = 64.0;
const BALL_SIZE_Y: f32 = 16.0;

fn run(world: &mut hecs::World) {
    let mut ball_entities = Vec::new();
    let mut paddle_entities = Vec::new();

    world
        .query_mut::<(Entity, &EntityType)>()
        .into_iter()
        .for_each(|(entity, EntityType(entity_type))| {
            if *entity_type == 3 {
                paddle_entities.push(entity);
            } else if *entity_type == 4 {
                ball_entities.push(entity);
            }
        });

    for paddle in paddle_entities {
        let mut closest_ball_dist = f32::MAX;

        for ball in &ball_entities {
            if let [Ok((paddle_pos, paddle_vel)), Ok((ball_pos, ball_vel))] =
                world.query_disjoint_mut::<(&Position, &mut Velocity), 2>([paddle, *ball])
            {
                let ball_future = **ball_pos + **ball_vel * PREDICTION_SECS;

                if (ball_future.x - paddle_pos.x) < closest_ball_dist {
                    closest_ball_dist = ball_future.x;

                    let paddle_ball_y_offset = ball_pos.y - paddle_pos.y;
                    let mut y_vel = 0.0;
                    if !(paddle_ball_y_offset > 0.0 && paddle_ball_y_offset < PADDLE_SIZE_Y - BALL_SIZE_Y) {
                        y_vel = paddle_ball_y_offset.signum() * MAX_SPEED;
                    }

                    *paddle_vel = Velocity(vector!(paddle_vel.x, y_vel));
                }
            }
        }
    }
}

inventory::submit! {
    Behavior {
        run,
    }
}
