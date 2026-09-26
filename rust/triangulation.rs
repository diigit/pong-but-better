use hecs::World;
use lyon::geom::euclid::UnknownUnit;
use lyon::geom::euclid::Point2D;
use lyon::tessellation::*;
use nalgebra::{Vector2, point, vector};
use web_sys::js_sys::{Float32Array, SharedArrayBuffer};

use crate::{
    movement::{Bounds, Position, Precision},
    shapes::Shape,
    utils::CanvasSize,
};

#[derive(Debug)]
pub struct Invisible;

pub struct TriangulationSystem {
    fill_tess: FillTessellator,
    fill_opts: FillOptions,
    canvas_size: Vector2<Precision>,
    exposed_array: LyonAdaptedArray,
}

impl TriangulationSystem {
    pub fn new(buffer: &SharedArrayBuffer, canvas_size: CanvasSize) -> Self {
        let exposed_array = Float32Array::new(buffer);

        Self {
            fill_tess: FillTessellator::new(),
            fill_opts: FillOptions::DEFAULT,
            canvas_size: vector![canvas_size.x, canvas_size.y],
            exposed_array: LyonAdaptedArray::new(exposed_array),
        }
    }

    pub fn run_triangulation(&mut self, world: &mut World) {
        self.exposed_array.clear();

        for (shape, position, bounds) in world
            .query_mut::<(&Shape, &Position, &Bounds)>()
            .without::<&Invisible>()
        {
            shape.write_vertices(
                &mut self.exposed_array,
                &mut self.fill_tess,
                &self.fill_opts,
                point![
                    position.x / self.canvas_size.x,
                    position.y / self.canvas_size.y
                ],
                vector![bounds.x / self.canvas_size.x, bounds.y / self.canvas_size.y],
            );
        }   
    }
}

#[derive(Debug)]
pub struct LyonAdaptedArray {
    buf: Float32Array,
    len: u32,
}

impl LyonAdaptedArray {
    pub fn new(buf: Float32Array) -> Self {
        return Self {
            buf,
            len: 0,
        }
    }

    pub fn clear(&mut self) {
        for index in 0..self.len {
            self.buf.set_index(index, 0.0);
        }
        self.len = 0;
    }

    pub fn push_point(&mut self, point: Point2D<Precision, UnknownUnit>) {
        self.buf.set_index(self.len, point.x);
        self.buf.set_index(self.len + 1, point.y);
        self.len += 2;
    }
}

impl GeometryBuilder for LyonAdaptedArray {
    fn add_triangle(&mut self, _: VertexId, _: VertexId, _: VertexId) {}
}

impl FillGeometryBuilder for LyonAdaptedArray {
    fn add_fill_vertex(&mut self, vertex: FillVertex) -> Result<VertexId, GeometryBuilderError> {
        self.push_point(vertex.position());
        Ok(0u32.into())
    }
}
