use lyon::{
    geom::euclid::Box2D,
    tessellation::{FillOptions, FillTessellator},
};
use nalgebra::{Point2, Vector2};

use crate::{movement::Precision, triangulation::LyonAdaptedArray};

#[derive(Debug)]
pub enum Shape {
    AxisAlignedBox,
}

impl Shape {
    pub fn write_vertices(
        &self,
        builder: &mut LyonAdaptedArray,
        fill_tess: &mut FillTessellator,
        opts: &FillOptions,
        position: Point2<Precision>,
        bounds: Vector2<Precision>,
    ) {
        match self {
            Self::AxisAlignedBox => {
                fill_tess
                    .tessellate_rectangle(
                        &Box2D {
                            min: lyon::math::point(position.x, position.y),
                            max: lyon::math::point(position.x + bounds.x, position.y + bounds.y),
                        },
                        opts,
                        builder,
                    )
                    .unwrap();
            }
        }
    }
}
