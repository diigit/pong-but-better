extern crate nalgebra as na;

use std::collections::{HashMap, HashSet};

use hecs::{CommandBuffer, Entity, World};
use nalgebra::{Vector2};
use wasm_bindgen::JsValue;
use web_sys::js_sys::Array;

use crate::{
    bvh::{BoundingBox, BoundingVolumeHierarchy},
    movement::*,
    shapes::Shape,
    utils::{sorted_entities_tuple},
};

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
    pub mass: &'a Mass,
}

impl<'a> From<(&'a mut Position, &'a mut Velocity, &'a Bounds, &'a Mass)> for CollidableObject<'a> {
    fn from(t: (&'a mut Position, &'a mut Velocity, &'a Bounds, &'a Mass)) -> Self {
        Self {
            position: t.0,
            velocity: t.1,
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

    pub fn axis_vec2(&self) -> Vector2<Precision> {
        match self.axis {
            Axis::X => Vector2::x(),
            Axis::Y => Vector2::y(),
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

pub type CollidableComponentsMut<'a> =
    hecs::Without<(&'a mut Position, &'a mut Velocity, &'a Bounds, &'a Mass), &'a IgnoreCollisions>;

pub type CollidableComponents<'a> =
    hecs::Without<(&'a Position, &'a Velocity, &'a Bounds, &'a Mass), &'a IgnoreCollisions>;

pub fn are_colliding(
    bounding_box_i: &BoundingBox,
    bounding_box_j: &BoundingBox,
) -> Option<CollisionDisplace> {
    let get_move = |dim: usize| {
        let bi1 = bounding_box_i.min[dim];
        let bi2 = bounding_box_i.max[dim];
        let bj1 = bounding_box_j.min[dim];
        let bj2 = bounding_box_j.max[dim];

        if (bi2 <= bj1) || (bi1 >= bj2) {
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
        .component_mul(&-(2.0 * displace.axis_vec2()));
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

    if mass_i > mass_j {
        entity_j.position.0 += displace.vec2();
    } else {
        entity_i.position.0 -= displace.vec2();
    }

    entity_i.velocity[displace.dim()] = vel_i;
    entity_j.velocity[displace.dim()] = vel_j;
}

pub fn run_collisions(world: &mut World) {
    let mut collisions_by_entity = HashMap::new();

    let mut entities: Vec<Entity> = world
        .query_mut::<Entity>()
        .with::<(&Position, &Velocity, &Bounds, &Mass)>()
        .without::<&IgnoreCollisions>()
        .into_iter()
        .collect();

    let mut bvh = BoundingVolumeHierarchy::sort_entities_and_new(world, &mut entities);
    let view = world.view_mut::<CollidableComponents>();

    for entity_i in entities.iter() {
        let colliding = bvh.get_colliding(&entity_i, &entities, &view);
        collisions_by_entity.insert(*entity_i, colliding);
    }

    let mut mutable_view = world.view_mut::<CollidableComponentsMut>();
    let mut colliding_pairs = HashSet::new();

    for (entity_i, collisions) in collisions_by_entity {
        for (entity_j, displace) in collisions {
            let tuple = sorted_entities_tuple(entity_i, entity_j);

            if colliding_pairs.contains(&tuple) {
                continue;
            }

            colliding_pairs.insert(tuple);

            let [result_i, result_j] = mutable_view.get_disjoint_mut::<2>([entity_i, entity_j]);

            let mut collidable_obj_i = CollidableObject::from(result_i.unwrap());
            let mut collidable_obj_j = CollidableObject::from(result_j.unwrap());

            if collidable_obj_i.mass.is_anchored() && collidable_obj_j.mass.is_anchored() {
                continue;
            }

            if collidable_obj_i.mass.is_anchored() {
                collide_static(displace, &mut collidable_obj_j);
            } else if collidable_obj_j.mass.is_anchored() {
                collide_static(displace.negative(), &mut collidable_obj_i);
            } else {
                collide(displace, &mut collidable_obj_i, &mut collidable_obj_j);
            }
        }
    }

    let mut world_command_buffer = CommandBuffer::new();

    for (entity_id, colliding_with) in world.query_mut::<(Entity, &CollidingWith)>() {
        if !colliding_pairs.remove(&sorted_entities_tuple(entity_id, colliding_with.0)) {
            world_command_buffer.remove_one::<CollidingWith>(entity_id);
        }
    }

    colliding_pairs.iter().for_each(|(entity_i, entity_j)| {
        world_command_buffer.insert_one(*entity_i, CollidingWith(*entity_j));
        world_command_buffer.insert_one(*entity_j, CollidingWith(*entity_i));
    });

    world_command_buffer.run_on(world);
}

pub fn get_collisions(world: &mut World) -> Option<Array> {
    let mut all_pairs = HashSet::new();

    for (entity_id, colliding_with) in world.query_mut::<(Entity, &CollidingWith)>() {
        all_pairs.insert(sorted_entities_tuple(entity_id, colliding_with.0));
    }

    if all_pairs.is_empty() {
        return None;
    }

    let array: Array = Array::new();

    all_pairs.iter().for_each(|(i, j)| {
        array.push(&JsValue::from(i.id()));
        array.push(&JsValue::from(j.id()));
    });

    Some(array)
}
