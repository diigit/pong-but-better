use hecs::World;
use nalgebra::{point, vector};

use crate::{collisions::spawn_collidable, constants::*, movement::*};

pub struct BorderSystem;

impl BorderSystem {
    pub fn create(world: &mut World) {
        let _left = spawn_collidable(
            world,
            Position(point![-BORDER_WIDTH, 0.0,]),
            Velocity::default(),
            Acceleration::default(),
            Bounds(vector![BORDER_WIDTH, CANVAS_HEIGHT]),
            Mass::anchored(),
        );
		
        let _right = spawn_collidable(
            world,
            Position(point![CANVAS_WIDTH, 0.0]),
            Velocity::default(),
            Acceleration::default(),
            Bounds(vector![BORDER_WIDTH, CANVAS_HEIGHT]),
            Mass::anchored(),
        );
		
        let _up = spawn_collidable(
            world,
            Position(point![0.0, -BORDER_WIDTH,]),
            Velocity::default(),
            Acceleration::default(),
            Bounds(vector![CANVAS_WIDTH, BORDER_WIDTH]),
            Mass::anchored(),
        );

        let _down = spawn_collidable(
            world,
            Position(point![0.0, CANVAS_HEIGHT,]),
            Velocity::default(),
            Acceleration::default(),
            Bounds(vector![CANVAS_WIDTH, BORDER_WIDTH]),
            Mass::anchored(),
        );
    }
}
