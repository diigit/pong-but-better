use core::f32;

use hecs::Entity;
use nalgebra::vector;

use crate::{
    behavior::Behavior,
    entity_tracker::EntityType,
    movement::{Acceleration, Bounds, Position, Velocity},
};

const MAX_SPEED: f32 = 300.0;
const PREDICTION_SECS: f32 = 0.3;

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
            if let [
                Ok((paddle_pos, _, paddle_bounds, paddle_vel)),
                Ok((ball_pos, ball_acc, ball_bounds, ball_vel)),
            ] = world
                .query_disjoint_mut::<(&Position, &Acceleration, &Bounds, &mut Velocity), 2>([
                    paddle, *ball,
                ])
            {
                if ball_vel.x.signum() != (paddle_pos.x - ball_pos.x).signum() {
                    // Ball moving away from paddle
                    continue;
                }

                let get_ball_future = |time_ahead: f32| {
                    **ball_pos + **ball_vel * time_ahead + (**ball_acc * (time_ahead.powi(2))) / 2.0
                };

                let ball_future = get_ball_future(PREDICTION_SECS);

                if (paddle_pos.x - ball_future.x) * ball_vel.x.signum() > 0.0 {
                    // Ball is too far away
                    continue;
                }

                let t =
                    -ball_vel.x + ball_vel.x.signum() * f32::sqrt(ball_vel.x.powi(2) + 2.0 * (paddle_pos.x - ball_pos.x));
                let target_position = vector![paddle_pos.x, get_ball_future(t).y];

                let distance = f32::abs(paddle_pos.x - ball_pos.x);

                if distance < closest_ball_dist {
                    closest_ball_dist = distance;

                    let paddle_ball_y_offset = target_position.y - paddle_pos.y;
                    let mut y_vel = 0.0;
                    if !(paddle_ball_y_offset > 0.0
                        && paddle_ball_y_offset < paddle_bounds.y - ball_bounds.y)
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
