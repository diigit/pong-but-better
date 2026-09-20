extern crate nalgebra as na;

use deref::{Deref, DerefMut};
use hecs::{Entity, World};
use na::{Point2, Vector2};

pub type Precision = f32;

#[derive(Debug)]
pub struct CollidingWith(pub Entity);

#[derive(Debug)]
pub struct Anchored;

#[derive(Debug, Deref, Clone, Copy)]
pub struct Mass(#[auto_ref] pub Precision);

impl Default for Mass {
    fn default() -> Self {
        Self(1.0)
    }
}

#[derive(Debug, Default, DerefMut)]
pub struct Position(#[auto_ref] pub Point2<Precision>);

#[derive(Debug, Default, DerefMut)]
pub struct Velocity(#[auto_ref] pub Vector2<Precision>);

#[derive(Debug, DerefMut)]
pub struct Acceleration(#[auto_ref] pub Vector2<Precision>);

impl Default for Acceleration {
    fn default() -> Self {
        Self(Vector2::new(0.0, 0.0))
    }
}

#[derive(Debug, DerefMut)]
pub struct Bounds(#[auto_ref] pub Vector2<Precision>);

impl Default for Bounds {
    fn default() -> Self {
        Self(Vector2::new(1.0, 1.0))
    }
}

pub fn run_movement(world: &mut World, time_delta: Precision) {
    for (e_pos, e_vel, e_accel) in
        world.query_mut::<(&mut Position, &mut Velocity, &Acceleration)>()
    {
        e_vel.0 += e_accel.0 * time_delta;
        e_pos.0 += e_vel.0 * time_delta;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn movement_test() {
        
    }
}
