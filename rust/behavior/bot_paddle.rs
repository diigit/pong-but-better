use core::f32;

use hecs::Entity;
use nalgebra::vector;
use wasm_bindgen_test::console_log;

use crate::{
    behavior::Behavior,
    constants::CANVAS_WIDTH,
    entity_tracker::EntityType,
    movement::{Position, Velocity},
};

const MAX_SPEED: f32 = 300.0;
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
                if ball_vel.x.signum() == -1.0 || ball_vel.x == 0.0 {
                    continue;
                }

                let ball_future = **ball_pos + **ball_vel * PREDICTION_SECS;
                if ball_future.x < CANVAS_WIDTH {
                    continue;
                }

                let target_position = ball_future
                    - (vector![
                        ball_future.x - CANVAS_WIDTH,
                        ball_vel.y * (ball_future.x - CANVAS_WIDTH) / ball_vel.x
                    ]);

                let distance = f32::abs(paddle_pos.x - ball_pos.x);

                if distance < closest_ball_dist {
                    closest_ball_dist = distance;

                    let paddle_ball_y_offset = target_position.y - paddle_pos.y;
                    let mut y_vel = 0.0;
                    if !(paddle_ball_y_offset > 0.0
                        && paddle_ball_y_offset < PADDLE_SIZE_Y - BALL_SIZE_Y)
                    {
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
