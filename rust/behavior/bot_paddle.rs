use core::f32;
use nalgebra::{Point2, Vector2, vector};

use crate::{
    behavior::Behavior,
    entity_tracker::EntityType,
    movement::{Acceleration, Bounds, Position, Precision, Velocity},
};

const MAX_SPEED: f32 = 300.0;
const PREDICTION_SECS: f32 = 0.3;

struct BallInfo {
    pub position: Point2<Precision>,
    pub acceleration: Vector2<Precision>,
    pub velocity: Vector2<Precision>,
    pub bounds: Vector2<Precision>,
}

fn run(world: &mut hecs::World) {
    let mut balls = Vec::new();

    world
        .query_mut::<(&EntityType, &Position, &Acceleration, &Velocity, &Bounds)>()
        .into_iter()
        .for_each(
            |(
                EntityType(entity_type),
                Position(pos),
                Acceleration(acc),
                Velocity(vel),
                Bounds(bounds),
            )| {
                if *entity_type == 4 {
                    balls.push(BallInfo {
                        position: *pos,
                        acceleration: *acc,
                        velocity: *vel,
                        bounds: *bounds,
                    });
                }
            },
        );

    for (EntityType(entity_type), paddle_pos, paddle_bounds, paddle_vel) in
        world.query_mut::<(&EntityType, &Position, &Bounds, &mut Velocity)>()
    {
        if *entity_type != 3 {
            continue;
        }

        let mut closest_ball_dist = f32::MAX;
        for ball in &balls {
            if ball.velocity.x.signum() != (paddle_pos.x - ball.position.x).signum() {
                // Ball moving away from paddle
                continue;
            }

            let get_ball_future = |time_ahead: f32| {
                ball.position
                    + ball.velocity * time_ahead
                    + (ball.acceleration * (time_ahead.powi(2))) / 2.0
            };

            let ball_future = get_ball_future(PREDICTION_SECS);

            if (paddle_pos.x - ball_future.x) * ball.velocity.x.signum() > 0.0 {
                // Ball is too far away
                continue;
            }

            let t = -ball.velocity.x
                + ball.velocity.x.signum()
                    * f32::sqrt(ball.velocity.x.powi(2) + 2.0 * (paddle_pos.x - ball.position.x));
            let target_position = vector![paddle_pos.x, get_ball_future(t).y];

            let distance = f32::abs(paddle_pos.x - ball.position.x);

            if distance < closest_ball_dist {
                closest_ball_dist = distance;

                let paddle_ball_y_offset = target_position.y - paddle_pos.y;
                let mut y_vel = 0.0;
                if !(paddle_ball_y_offset > 0.0
                    && paddle_ball_y_offset < paddle_bounds.y - ball.bounds.y)
                {
                    y_vel = paddle_ball_y_offset.signum() * MAX_SPEED;
                }

                *paddle_vel = Velocity(vector!(paddle_vel.x, y_vel));
            }
        }
    }
}

inventory::submit! {
    Behavior {
        run,
    }
}
