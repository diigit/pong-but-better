use std::collections::{
    HashMap,
    hash_map::Entry::{Occupied, Vacant},
};

use hecs::{Entity, View, World};
use morton_encoding::morton_encode;
use nalgebra::Point2;

use crate::{
    collisions::{CollidableComponents, CollisionDisplace, are_colliding},
    movement::*,
};

#[derive(Clone, Copy, PartialEq)]
pub struct BoundingBox {
    pub min: Point2<Precision>,
    pub max: Point2<Precision>,
}

impl BoundingBox {
    pub fn from_position_and_bounds(position: &Position, bounds: &Bounds) -> Self {
        Self {
            min: position.0,
            max: position.0 + bounds.0,
        }
    }
}

pub struct BoundingVolumeHierarchy {
    bounding_box_cache: HashMap<(usize, usize), BoundingBox>,
}

// TODO This is pretty bad code, a refactor is in order

impl BoundingVolumeHierarchy {
    pub fn sort_entities_and_new(world: &mut World, entities: &mut Vec<Entity>) -> Self {
        let mut orders: HashMap<Entity, u64> = HashMap::with_capacity(entities.len());

        let mut view = world.view_mut::<(&Position, &Velocity, &Bounds, &Mass)>();

        for entity in entities.iter() {
            let (pos, _, _, _) = view.get_mut(*entity).unwrap();
            orders.insert(*entity, morton_encode([pos.x.to_bits(), pos.y.to_bits()]));
        }

        entities.sort_by_key(|x| orders.get(x));

        Self {
            bounding_box_cache: HashMap::new(),
        }
    }

    pub fn get_colliding(
        &mut self,
        entity: &Entity,
        sorted_entities: &Vec<Entity>,
        view: &View<'_, CollidableComponents>,
    ) -> Vec<(Entity, CollisionDisplace)> {
        let mut all_colliding: Vec<(Entity, CollisionDisplace)> = Vec::new();
        let (pos, _, bounds, _) = view.get(*entity).unwrap();
        let bounding_box = BoundingBox::from_position_and_bounds(pos, bounds);

        self.get_colliding_in_slice(
            view,
            sorted_entities,
            &bounding_box,
            &mut all_colliding,
            0,
            sorted_entities.len(),
        );

        all_colliding
    }

    fn get_colliding_in_slice(
        &mut self,
        view: &View<'_, CollidableComponents>,
        sorted_entities: &Vec<Entity>,
        bounding_box: &BoundingBox,
        all_colliding: &mut Vec<(Entity, CollisionDisplace)>,
        lower: usize,
        upper: usize,
    ) {
        let len = upper - lower;

        if len == 0 {
            return;
        }

        if len == 1 {
            let entity = sorted_entities[lower];

            let (pos, _, bounds, _) = view.get(entity).unwrap();
            let other_bounding_box = BoundingBox::from_position_and_bounds(pos, bounds);
            if other_bounding_box.eq(bounding_box) {
                return;
            }

            if let Some(collision) = are_colliding(bounding_box, &other_bounding_box) {
                all_colliding.push((entity, collision));
            }
        } else {
            let result = are_colliding(
                bounding_box,
                self.get_group_bounding_box(view, sorted_entities, upper, lower),
            );

            if !result.is_none() {
                let middle = lower + len / 2;
                self.get_colliding_in_slice(
                    view,
                    sorted_entities,
                    bounding_box,
                    all_colliding,
                    lower,
                    middle,
                );
                self.get_colliding_in_slice(
                    view,
                    sorted_entities,
                    bounding_box,
                    all_colliding,
                    middle,
                    upper,
                );
            }
        }
    }

    fn get_group_bounding_box(
        &mut self,
        view: &View<'_, CollidableComponents>,
        sorted_entities: &Vec<Entity>,
        upper: usize,
        lower: usize,
    ) -> &BoundingBox {
        match self.bounding_box_cache.entry((upper, lower)) {
            Occupied(entry) => {
                return entry.into_mut();
            }

            Vacant(entry) => {
                let mut min_point = Point2::new(f32::MAX, f32::MAX);
                let mut max_point = Point2::new(f32::MIN, f32::MIN);

                for entity in &sorted_entities[lower..upper] {
                    let (pos, _, bounds, _) = view.get(*entity).unwrap();

                    min_point.x = f32::min(min_point.x, pos.x);
                    min_point.y = f32::min(min_point.y, pos.y);
                    max_point.x = f32::max(max_point.x, pos.x + bounds.x);
                    max_point.y = f32::max(max_point.y, pos.y + bounds.y);
                }

                let bounding_box = BoundingBox {
                    min: min_point,
                    max: max_point,
                };

                return entry.insert(bounding_box);
            }
        }
    }
}
