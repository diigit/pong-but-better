extern crate nalgebra as na;

use std::{
    collections::{HashSet, hash_set::Iter},
    hash::Hash,
};

use hecs::{CommandBuffer, Entity, World};
use nalgebra::Vector2;
use wasm_bindgen::JsValue;
use web_sys::js_sys::Array;

use crate::{movement::*, shapes::Shape};

#[derive(Debug)]
pub struct CollidingWith(pub Entity);

pub struct IgnoreCollisions;

pub fn spawn_collidable(
    world: &mut World,
    position: Position,
    velocity: Velocity,
    acceleration: Acceleration,
    bounds: Bounds,
    mass: Mass,
) -> Entity {
    world.spawn((
        position,
        velocity,
        acceleration,
        bounds,
        mass,
        Shape::AxisAlignedBox,
    ))
}

pub struct CollidableObject<'a> {
    pub position: &'a mut Position,
    pub velocity: &'a mut Velocity,
    pub bounds: &'a Bounds,
    pub mass: &'a Mass,
}

impl<'a> From<(&'a mut Position, &'a mut Velocity, &'a Bounds, &'a Mass)> for CollidableObject<'a> {
    fn from(t: (&'a mut Position, &'a mut Velocity, &'a Bounds, &'a Mass)) -> Self {
        Self {
            position: t.0,
            velocity: t.1,
            bounds: t.2,
            mass: t.3,
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
        if x.abs() < y.abs() {
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

    pub fn vec2(&self) -> Vector2<Precision> {
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

        let move_1 = bi2 - bj1;
        let move_2 = bi1 - bj2;

        Some(if move_1.abs() < move_2.abs() {
            move_1
        } else {
            move_2
        })
    };

    Some(CollisionDisplace::from_xy(get_move(0)?, get_move(1)?))
}

pub fn collide_static(displace: CollisionDisplace, adjusting_entity: &mut CollidableObject) {
    let displacement_vector = displace.vec2();
    adjusting_entity.position.0 += displacement_vector;
    adjusting_entity.velocity.0 += adjusting_entity
        .velocity
        .component_mul(&-(2.0 * displacement_vector.abs() / displacement_vector.magnitude()));
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

pub fn run_collisions(world: &mut World) {
    let query = world
        .query_mut::<(Entity, &mut Position, &mut Velocity, &Bounds, &Mass)>()
        .without::<&IgnoreCollisions>();
    let entity_ids: Vec<Entity> = query.into_iter().map(|(e, _, _, _, _)| e).collect();

    let mut colliding_pairs = PairsSet::new();

    for i in 0..entity_ids.len() {
        for j in (i + 1)..entity_ids.len() {
            let [result_i, result_j] = world
                .query_disjoint_mut::<(&mut Position, &mut Velocity, &Bounds, &Mass), 2>([
                    entity_ids[i],
                    entity_ids[j],
                ]);

            let mut entity_i = CollidableObject::from(result_i.unwrap());
            let mut entity_j = CollidableObject::from(result_j.unwrap());

            if let Some(displace) = are_colliding(&entity_i, &entity_j) {
                if entity_i.mass.is_anchored() && entity_j.mass.is_anchored() {
                    continue;
                }

                if entity_i.mass.is_anchored() {
                    collide_static(displace, &mut entity_j);
                } else if entity_j.mass.is_anchored() {
                    collide_static(displace.negative(), &mut entity_i);
                } else {
                    collide(displace, &mut entity_i, &mut entity_j);
                }

                colliding_pairs.add(entity_ids[i], entity_ids[j]);
            }
        }
    }

    let mut world_command_buffer = CommandBuffer::new();

    for (entity_id, colliding_with) in world.query_mut::<(Entity, &CollidingWith)>() {
        if !colliding_pairs.remove(entity_id, colliding_with.0) {
            world_command_buffer.remove_one::<CollidingWith>(entity_id);
        }
    }

    colliding_pairs.iter().for_each(|(entity_i, entity_j)| {
        world_command_buffer.insert_one(*entity_i, CollidingWith(*entity_j));
        world_command_buffer.insert_one(*entity_j, CollidingWith(*entity_i));
    });

    world_command_buffer.run_on(world);
}

pub struct PairsSet<T>
where
    T: Copy + Hash + Eq + ?Sized,
{
    set: HashSet<(T, T)>,
}

impl<T> PairsSet<T>
where
    T: Copy + Hash + Eq + ?Sized,
{
    pub fn new() -> Self {
        Self {
            set: HashSet::new(),
        }
    }

    pub fn get(&self, i: T, j: T) -> Option<(T, T)> {
        let tuple = (i, j);
        let reverse = (j, i);

        if self.set.contains(&tuple) {
            return Some(tuple);
        } else if self.set.contains(&reverse) {
            return Some(reverse);
        }

        None
    }

    pub fn add(&mut self, i: T, j: T) {
        if self.get(i, j) != None {
            return;
        }

        self.set.insert((i, j));
    }

    pub fn remove(&mut self, i: T, j: T) -> bool {
        if let Some(tuple) = self.get(i, j) {
            return self.set.remove(&tuple);
        }

        false
    }

    pub fn is_empty(&self) -> bool {
        self.set.is_empty()
    }

    pub fn iter(&self) -> Iter<'_, (T, T)> {
        return self.set.iter();
    }
}

pub fn get_collisions(world: &mut World) -> Option<Array> {
    let mut all_pairs = PairsSet::new();

    for (entity_id, colliding_with) in world.query_mut::<(Entity, &CollidingWith)>() {
        all_pairs.add(entity_id, colliding_with.0);
    }

    if all_pairs.is_empty() { return None; }

    let array: Array = Array::new();

    all_pairs.iter().for_each(|(i, j)| {
        array.push(&JsValue::from(i.id()));
        array.push(&JsValue::from(j.id()));
    });

    Some(array)
}
