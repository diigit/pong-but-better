use std::ops::Div;

use hecs::World;
use lyon::{
    math::Point,
    path::builder::NoAttributes,
    tessellation::{
        BuffersBuilder, FillBuilder, FillOptions, FillTessellator, VertexBuffers,
        geometry_builder::{Positions, simple_builder},
    },
};
use nalgebra::{Vector2, point, vector};
use wasm_bindgen_test::{__rt::console_log, console_log};

use crate::{
    CanvasSize, VertexBufferPtr,
    movement::{Bounds, Position, Precision},
    shapes::Shape,
};

#[derive(Debug)]
pub struct Invisible;

pub struct TriangulationSystem {
    buffer: VertexBuffers<Point, u16>,
    fill_tess: FillTessellator,
    fill_opts: FillOptions,
    canvas_size: Vector2<Precision>,
}

impl TriangulationSystem {
    pub fn new(canvas_size: CanvasSize) -> Self {
        Self {
            buffer: VertexBuffers::new(),
            fill_tess: FillTessellator::new(),
            fill_opts: FillOptions::DEFAULT,
            canvas_size: vector![canvas_size.x, canvas_size.y],
        }
    }

    pub fn run_triangulation(&mut self, world: &mut World) {
        let buffer = &mut self.buffer;
        buffer.clear();

        let mut geo_builder: BuffersBuilder<'_, Point, u16, Positions> = simple_builder(buffer);
        let mut builder: NoAttributes<FillBuilder<'_>> =
            self.fill_tess.builder(&self.fill_opts, &mut geo_builder);

        for (shape, position, bounds) in world
            .query_mut::<(&Shape, &Position, &Bounds)>()
            .without::<&Invisible>()
        {
            shape.write_vertices(
                &mut builder,
                point![
                    position.x / self.canvas_size.x,
                    position.y / self.canvas_size.y
                ],
                vector![bounds.x / self.canvas_size.x, bounds.y / self.canvas_size.y],
            );
        }
        
        builder.build().unwrap();
    }

    pub fn get_buffer_ptr(&self) -> VertexBufferPtr {

        // TODO: vertex buffer ptr pointing to 0
        // either wasm bindgen pointer is not doing the things i expect with this struct
        // or this self.buffer.vertices.as_ptr() is 0.
        VertexBufferPtr {
            ptr: self.buffer.vertices.as_ptr() as *const f32,
            len: self.buffer.vertices.len(),
        }
    }
}
