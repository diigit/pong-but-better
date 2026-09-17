extern crate nalgebra as na;

use std::collections::HashSet;

use deref::{Deref, DerefMut};
use na::{Point2, Vector2};
use specs::{prelude::*, Component};

pub type Precision = f32;

#[derive(Debug)]
pub struct CollidingWith(pub Entity);

impl Component for CollidingWith {
    type Storage = FlaggedStorage<Self, DenseVecStorage<Self>>;
}

#[derive(Debug, Component)]
#[storage(NullStorage)]
pub struct Anchored;

#[derive(Debug, Component, Deref, Clone, Copy)]
#[storage(DefaultVecStorage)]
pub struct Mass(#[auto_ref] pub Precision);

impl Default for Mass {
    fn default() -> Self {
        Self(1.0)
    }
}

#[derive(Debug, Component, Default, DerefMut)]
#[storage(DefaultVecStorage)]
pub struct Position(#[auto_ref] pub Point2<Precision>);

#[derive(Debug, Component, Default, DerefMut)]
#[storage(DefaultVecStorage)]
pub struct Velocity(#[auto_ref] pub Vector2<Precision>);

#[derive(Debug, Component, DerefMut)]
#[storage(DefaultVecStorage)]
pub struct Acceleration(#[auto_ref] pub Vector2<Precision>);

impl Default for Acceleration {
    fn default() -> Self {
        Self(Vector2::new(0.0, 0.0))
    }
}

#[derive(Debug, Component, DerefMut)]
#[storage(DefaultVecStorage)]
pub struct Bounds(#[auto_ref] pub Vector2<Precision>);

impl Default for Bounds {
    fn default() -> Self {
        Self(Vector2::new(1.0, 1.0))
    }
}

#[derive(Default, DerefMut)]
pub struct TimeDelta(#[auto_ref] pub f32);

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
    velocities: WriteStorage<'a, Velocity>,
    bounds: ReadStorage<'a, Bounds>,
    anchored: ReadStorage<'a, Anchored>,
    mass: ReadStorage<'a, Mass>,
    entities: Entities<'a>,
    colliding_with: WriteStorage<'a, CollidingWith>,
}

pub struct CollidableObject<'a> {
    pub position: &'a mut Position,
    pub velocity: &'a mut Velocity,
    pub bounds: &'a Bounds,
    pub mass: &'a Mass,
    pub anchored: bool,
    pub entity_id: Entity,
}

impl<'a>
    From<(
        &'a mut Position,
        &'a mut Velocity,
        &'a Bounds,
        &'a Mass,
        Entity,
        bool,
    )> for CollidableObject<'a>
{
    fn from(
        t: (
            &'a mut Position,
            &'a mut Velocity,
            &'a Bounds,
            &'a Mass,
            Entity,
            bool,
        ),
    ) -> Self {
        Self {
            position: t.0,
            velocity: t.1,
            bounds: t.2,
            mass: t.3,
            anchored: t.5,
            entity_id: t.4,
        }
    }
}

#[derive(Clone, Copy)]
enum Axis {
    X,
    Y,
}

#[derive(Clone, Copy)]
pub struct CollisionDisplace {
    axis: Axis,
    displace: Precision,
}

impl CollisionDisplace {
    pub fn from_xy(x: Precision, y: Precision) -> Self {
        if x.abs() > y.abs() {
            Self {
                axis: Axis::X,
                displace: x,
            }
        } else {
            Self {
                axis: Axis::Y,
                displace: y,
            }
        }
    }

    pub fn to_vec2(&self) -> Vector2<Precision> {
        match self.axis {
            Axis::X => Vector2::new(self.displace, 0.0),
            Axis::Y => Vector2::new(0.0, self.displace),
        }
    }

    pub fn negative(&self) -> Self {
        let mut clone = self.clone();
        clone.displace = -clone.displace;
        clone
    }

    pub fn dim(&self) -> usize {
        match self.axis {
            Axis::X => 0,
            Axis::Y => 1,
        }
    }
}

impl Collisions {
    // note: Positions are assumed to be in the top-left corner of the bounding box
    // note 2: if there is a collision, it returns the minimum amount to move move entity i out of the collision
    // if you want to move entity j instead, make the result negative.
    pub fn are_colliding(
        entity_i: &CollidableObject,
        entity_j: &CollidableObject,
    ) -> Option<CollisionDisplace> {
        let get_move = |dim: usize| {
            let bi1 = entity_i.position[dim];
            let bi2 = entity_i.position[dim] + entity_i.bounds[dim];
            let bj1 = entity_j.position[dim];
            let bj2 = entity_j.position[dim] + entity_j.bounds[dim];

            if (bi2 < bj1) || (bi1 > bj2) {
                return None;
            }

            let move_1 = bj1 - bi2;
            let move_2 = bj2 - bi1;

            Some(if move_1.abs() < move_1.abs() {
                move_1
            } else {
                move_2
            })
        };

        Some(CollisionDisplace::from_xy(get_move(0)?, get_move(1)?))
    }

    pub fn collide_static(displace: CollisionDisplace, adjusting_entity: &mut CollidableObject) {
        adjusting_entity.position.0 += displace.to_vec2();
        adjusting_entity.velocity.0 *= -displace.to_vec2().abs().normalize_mut()
    }

    pub fn collide(
        displace: CollisionDisplace,
        entity_i: &mut CollidableObject,
        entity_j: &mut CollidableObject,
    ) {
        let init_vel_i = entity_i.velocity[displace.dim()];
        let init_vel_j = entity_j.velocity[displace.dim()];

        let mass_i = **entity_i.mass;
        let mass_j = **entity_j.mass;

        let r = 1.0 / (mass_i + mass_j);

        let vel_i = (mass_i - mass_j) * r * init_vel_i + 2.0 * mass_j * r * init_vel_j;
        let vel_j = (mass_j - mass_i) * r * init_vel_j + 2.0 * mass_i * r * init_vel_i;

        entity_i.velocity[displace.dim()] = vel_i;
        entity_j.velocity[displace.dim()] = vel_j;
    }
}

impl<'a> System<'a> for Collisions {
    type SystemData = CollisionsSystemData<'a>;

    fn run(&mut self, mut data: Self::SystemData) {
        let anchored = data.anchored;

        let mut iter = (
            &mut data.positions,
            &mut data.velocities,
            &data.bounds,
            &data.mass,
            &data.entities,
        )
            .join()
            .map(|e| {
                let entity_is_anchored = anchored.contains(e.4);
                CollidableObject::from((e.0, e.1, e.2, e.3, e.4, entity_is_anchored))
            });

        let mut collided: HashSet<(Entity, Entity)> = HashSet::new();

        while let Some(mut entity_i) = iter.next() {
            for mut entity_j in &mut iter {
                if let Some(displace) = Self::are_colliding(&entity_i, &entity_j) {
                    if entity_i.anchored && entity_j.anchored {
                        continue;
                    }

                    if entity_i.anchored {
                        Self::collide_static(displace.negative(), &mut entity_j);
                    } else if entity_j.anchored {
                        Self::collide_static(displace, &mut entity_i);
                    }

                    Self::collide(displace, &mut entity_i, &mut entity_j);

                    collided.insert((entity_i.entity_id, entity_j.entity_id));
                }
            }
        }

        let mut remove: HashSet<Entity> = HashSet::new();

        for (entity, colliding_with) in (&data.entities, &data.colliding_with).join() {
            if !collided.contains(&(entity, colliding_with.0)) {
                remove.insert(entity);
            }
        }

        for entity in remove {
            data.colliding_with.remove(entity);
        }

        for (entity_i, entity_j) in collided {
            let _ = data
                .colliding_with
                .insert(entity_i, CollidingWith(entity_j));
            let _ = data
                .colliding_with
                .insert(entity_j, CollidingWith(entity_i));
        }
    }
}

pub fn create_moving_entity(
    world: &mut World,
    position: Position,
    velocity: Velocity,
    acceleration: Acceleration,
    bounds: Bounds,
    mass: Mass,
) {
    let _ = world
        .create_entity()
        .with(position)
        .with(velocity)
        .with(acceleration)
        .with(bounds)
        .with(mass)
        .build();
}

#[cfg(test)]
mod tests {
    use nalgebra::{point, vector};

    use super::*;

    #[derive(Default)]
    pub struct CollisionFlag(bool);

    pub struct CollisionDetector {
        pub reader_id: ReaderId<ComponentEvent>,
        pub inserted: BitSet,
    }

    impl<'a> System<'a> for CollisionDetector {
        type SystemData = (ReadStorage<'a, CollidingWith>, Write<'a, CollisionFlag>);

        fn run(&mut self, (colliding_with, mut collision_flag): Self::SystemData) {
            self.inserted.clear();

            let events = colliding_with.channel().read(&mut self.reader_id);

            for event in events {
                match event {
                    ComponentEvent::Inserted(id) => {
                        self.inserted.add(*id);
                    }
                    _ => {}
                }
            }

            for _ in (&self.inserted).join() {
                collision_flag.0 = true;
            }
        }
    }

    #[test]
    fn collision_test() {
        let mut world = World::new();
        world.register::<CollidingWith>();
        world.register::<Acceleration>();

        let collision_detector = CollisionDetector {
            reader_id: world.write_storage::<CollidingWith>().register_reader(),
            inserted: BitSet::new(),
        };

        let mut dispatcher = DispatcherBuilder::new()
            .with(Movement, "movement", &[])
            .with(Collisions, "collisions", &["movement"])
            .with(collision_detector, "collision_detector", &["collisions"])
            .build();
        dispatcher.setup(&mut world);

        create_moving_entity(
            &mut world,
            Position(point![0.0, 0.0]),
            Velocity(vector![0.6, 1.0]),
            Acceleration::default(),
            Bounds::default(),
            Mass(2.0),
        );

        create_moving_entity(
            &mut world,
            Position(point![5.0, 0.0]),
            Velocity(vector![-1.0, 1.0]),
            Acceleration::default(),
            Bounds::default(),
            Mass(3.0),
        );

        *world.write_resource::<TimeDelta>() = TimeDelta(0.005);
        for _ in 0..1000 {
            dispatcher.dispatch(&world);
        }

        world.maintain();

        assert!(world.read_resource::<CollisionFlag>().0);

        let a = world.read_component::<Velocity>();
        let b = a.as_slice();
        println!("{:?}", b);

        assert!((b[0].x + 1.32).abs() < 0.01);
        assert!((b[1].x - 0.28).abs() < 0.01);
    }
}
