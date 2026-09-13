extern crate nalgebra as na;

use na::{Point2, Vector2};

use specs::{prelude::*, Component};

type Precision = f32;

#[derive(Debug, Component)]
#[storage(VecStorage)]
pub struct Position(Point2<Precision>);

#[derive(Debug, Component)]
#[storage(VecStorage)]
pub struct Velocity(Vector2<Precision>);

#[derive(Debug, Component)]
#[storage(VecStorage)]
pub struct Acceleration(Vector2<Precision>);

#[derive(Debug, Component)]
#[storage(VecStorage)]
pub struct Bounds(Vector2<Precision>);

#[derive(Default)]
pub struct TimeDelta(f32);

pub struct Movement;

#[derive(SystemData)]
pub struct MovementSystemData<'a> {
    positions: WriteStorage<'a, Position>,
    velocities: WriteStorage<'a, Velocity>,
    accelerations: ReadStorage<'a, Acceleration>,
    time_delta: Read<'a, TimeDelta>,
}

impl<'a> System<'a> for Movement {
    type SystemData = MovementSystemData<'a>;

    fn run(&mut self, mut data: Self::SystemData) {
        let time_delta = data.time_delta.0;

		for (e_pos, e_vel, e_accel) in (
            &mut data.positions,
            &mut data.velocities,
            &data.accelerations,
        )
            .join()
        {
			e_vel.0 += e_accel.0 * time_delta;
			e_pos.0 += e_vel.0 * time_delta;
		}
    }
}

pub struct Collisions;

#[derive(SystemData)]
pub struct CollisionsSystemData<'a> {
    positions: WriteStorage<'a, Position>,
    accelerations: WriteStorage<'a, Acceleration>,
    time_delta: Read<'a, TimeDelta>,
	bounds: ReadStorage<'a, Bounds>,
}

impl<'a> System<'a> for  Collisions {
    type SystemData =  CollisionsSystemData<'a>;

    fn run(&mut self, mut data: Self::SystemData) {
        
    }
}