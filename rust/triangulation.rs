use hecs::World;
use lyon::geom::euclid::Point2D;
use lyon::geom::euclid::UnknownUnit;
use lyon::tessellation::*;
use nalgebra::{point, vector};
use web_sys::js_sys::Uint16Array;
use web_sys::js_sys::{Float32Array, SharedArrayBuffer};

use crate::constants;
use crate::gameplay::DataBuffer;
use crate::{
    movement::{Bounds, Position, Precision},
    shapes::Shape,
};

#[derive(Debug)]
pub struct Invisible;

pub struct TriangulationSystem {
    fill_tess: FillTessellator,
    fill_opts: FillOptions,
    exposed_array: SharedBuffer,
}

impl TriangulationSystem {
    pub fn new(
        vertex_buffer: &SharedArrayBuffer,
        index_buffer: &SharedArrayBuffer,
        data_buffer: DataBuffer,
    ) -> Self {
        Self {
            fill_tess: FillTessellator::new(),
            fill_opts: FillOptions::DEFAULT,
            exposed_array: SharedBuffer::new(
                Float32Array::new(vertex_buffer),
                Uint16Array::new(index_buffer),
                data_buffer,
            ),
        }
    }

    pub fn run_triangulation(&mut self, world: &mut World) {
        if self.exposed_array.is_locked() {
            return;
        };
        self.exposed_array.set_locked(true);
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

        self.exposed_array.set_locked(false);
    }
}

#[derive(Debug)]
pub struct SharedBuffer {
    vertices: Float32Array,
    indices: Uint16Array,
    vertex_count: u16,
    index_count: u16,
    data_buffer: DataBuffer,
}

impl SharedBuffer {
    pub fn new(vertices: Float32Array, indices: Uint16Array, data_buffer: DataBuffer) -> Self {
        return Self {
            vertices,
            indices,
            vertex_count: 0,
            index_count: 0,
            data_buffer,
        };
    }

    pub fn clear(&mut self) {
        for index in 0..self.vertex_count * 2 {
            self.vertices.set_index(index as u32, 0.0)
        }
        self.vertex_count = 0;
        self.data_buffer.set_vertex_buf_len(0);

        for index in 0..self.index_count {
            self.indices.set_index(index as u32, 0u16)
        }
        self.index_count = 0;
        self.data_buffer.set_index_buf_len(0);
    }

    pub fn push_point(&mut self, point: Point2D<Precision, UnknownUnit>) -> VertexId {
        let id = self.vertex_count;
        let index = (self.vertex_count * 2) as u32;
        self.vertices.set_index(index, point.x);
        self.vertices.set_index(index + 1, point.y);
        self.vertex_count += 1;
        self.data_buffer
            .set_vertex_buf_len(self.vertex_count as u32);

        VertexId(id as u32)
    }

    pub fn push_id(&mut self, id: VertexId) {
        self.indices.set_index(self.index_count as u32, id.0 as u16);
        self.index_count += 1;
        self.data_buffer.set_index_buf_len(self.index_count as u32);
    }

    pub fn is_locked(&self) -> bool {
        self.data_buffer.is_locked()
    }

    pub fn set_locked(&mut self, locked: bool) {
        self.data_buffer.set_locked(locked);
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
