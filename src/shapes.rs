use lyon::{
    geom::euclid::Box2D,
    path::{builder::NoAttributes, Winding},
    tessellation::FillBuilder,
};
use nalgebra::{Point2, Vector2};

use crate::physics::Precision;

pub enum Shape {
    AxisAlignedBox,
}

impl Shape {
    pub fn write_vertices(
        &self,
        builder: &mut NoAttributes<FillBuilder>,
        position: Point2<Precision>,
        bounds: Vector2<Precision>,
    ) {
        match self {
            Self::AxisAlignedBox => {
                builder.add_rectangle(
                    &Box2D {
                        min: lyon::math::point(position.x, position.y),
                        max: lyon::math::point(position.x + bounds.x, position.y + bounds.y),
                    },
                    Winding::Positive,
                );
            }
        }
    }
}
