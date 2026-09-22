extern crate nalgebra as na;

use hecs::{Entity, World};
use nalgebra::Vector2;

use crate::movement::*;

pub struct IgnoreCollisions;

pub fn spawn_collidable(
    world: &mut World,
    position: Position,
    velocity: Velocity,
    bounds: Bounds,
    mass: Mass,
) -> Entity {
    world.spawn((position, velocity, bounds, mass))
}

pub struct CollidableObject<'a> {
    pub entity_id: Entity,
    pub position: &'a mut Position,
    pub velocity: &'a mut Velocity,
    pub bounds: &'a Bounds,
    pub mass: &'a Mass,
}

impl<'a>
    From<(
        Entity,
        &'a mut Position,
        &'a mut Velocity,
        &'a Bounds,
        &'a Mass,
    )> for CollidableObject<'a>
{
    fn from(
        t: (
            Entity,
            &'a mut Position,
            &'a mut Velocity,
            &'a Bounds,
            &'a Mass,
        ),
    ) -> Self {
        Self {
            entity_id: t.0,
            position: t.1,
            velocity: t.2,
            bounds: t.3,
            mass: t.4,
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

pub fn run_collisions(world: &mut World) {
    let mut query_iter = world
        .query_mut::<(
            Entity,
            &mut Position,
            &mut Velocity,
            &Bounds,
            &Mass,
        )>().without::<&IgnoreCollisions>()
        .into_iter()
        .map(CollidableObject::from);

    // TODO: Collision Event

    while let Some(mut entity_i) = query_iter.next() {
        for mut entity_j in &mut query_iter {
            if let Some(displace) = are_colliding(&entity_i, &entity_j) {                
                if entity_i.mass.is_anchored() && entity_j.mass.is_anchored() {
                    continue;
                }

                if entity_i.mass.is_anchored() {
                    collide_static(displace.negative(), &mut entity_j);
                } else if entity_j.mass.is_anchored() {
                    collide_static(displace, &mut entity_i);
                }

                collide(displace, &mut entity_i, &mut entity_j);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn collision_test() {
        // TODO
    }
}
