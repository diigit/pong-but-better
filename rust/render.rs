use hecs::World;
use lyon::geom::euclid::Point2D;
use lyon::geom::euclid::UnknownUnit;
use lyon::tessellation::*;
use nalgebra::{point, vector};
use wasm_bindgen_test::console_log;
use web_sys::js_sys::Uint16Array;
use web_sys::js_sys::{Float32Array};

use crate::constants;
use crate::{
    movement::{Bounds, Position, Precision},
    shapes::Shape,
};

#[derive(Debug)]
pub struct Invisible;

pub struct RenderSystem {
    fill_tess: FillTessellator,
    fill_opts: FillOptions,
    exposed_array: SharedBuffer,
}

impl RenderSystem {
    pub fn new(vertex_buffer: Float32Array, index_buffer: Uint16Array) -> Self {
        Self {
            fill_tess: FillTessellator::new(),
            fill_opts: FillOptions::DEFAULT,
            exposed_array: SharedBuffer::new(vertex_buffer, index_buffer),
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
                    2.0 * position.x / constants::CANVAS_WIDTH - 1.0,
                    2.0 * position.y / constants::CANVAS_HEIGHT - 1.0,
                ],
                vector![
                    2.0 * bounds.x / constants::CANVAS_WIDTH,
                    2.0 * bounds.y / constants::CANVAS_HEIGHT
                ],
            );
        }
    }
}

#[derive(Debug)]
pub struct SharedBuffer {
    vertices: Float32Array,
    indices: Uint16Array,
    vertices_len: u16,
    indices_len: u16,
}

impl SharedBuffer {
    pub fn new(vertices: Float32Array, indices: Uint16Array) -> Self {
        return Self {
            vertices,
            indices,
            vertices_len: 0,
            indices_len: 0,
        };
    }

    pub fn clear(&mut self) {
        for index in 0..self.vertices_len {
            self.vertices.set_index(index as u32, 0.0)
        }
        self.vertices_len = 0;

        for index in 0..self.indices_len {
            self.indices.set_index(index as u32, 0u16)
        }
        self.indices_len = 0;
    }

    pub fn push_point(&mut self, point: Point2D<Precision, UnknownUnit>) -> VertexId {
        let id = self.vertices_len/2;
        let index = (self.vertices_len) as u32;
        self.vertices.set_index(index, point.x);
        self.vertices.set_index(index + 1, point.y);
        self.vertices_len += 2;

        VertexId(id as u32)
    }

    pub fn push_id(&mut self, id: VertexId) {
        self.indices.set_index(self.indices_len as u32, id.0 as u16);
        self.indices_len += 1;
    }
}

impl GeometryBuilder for SharedBuffer {
    fn add_triangle(&mut self, a: VertexId, b: VertexId, c: VertexId) {
        self.push_id(a);
        self.push_id(b);
        self.push_id(c);
    }
}

impl FillGeometryBuilder for SharedBuffer {
    fn add_fill_vertex(&mut self, vertex: FillVertex) -> Result<VertexId, GeometryBuilderError> {
        Ok(self.push_point(vertex.position()))
    }
}
