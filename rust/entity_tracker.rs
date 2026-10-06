use deref::Deref;
use hecs::{Entity, World};
use nalgebra::{point, vector};
use web_sys::js_sys::{self, DataView, Int32Array, SharedArrayBuffer};

use crate::{
    collisions::spawn_collidable,
    movement::*,
    utils::{Command, EntityCreationParams},
};

const ENTITY_ID_OFFSET: usize = 4;
const ENTITY_TYPE_OFFSET: usize = 8;
const POSITION_OFFSET: usize = 12;
const VELOCITY_OFFSET: usize = 20;
const ACCELERATION_OFFSET: usize = 28;
const BOUNDS_OFFSET: usize = 36;
const MASS_OFFSET: usize = 44;

#[derive(Deref)]
pub struct EntityType(#[auto_ref] pub u32);

pub struct EntityTrackingSystem {
    buffer: SharedArrayBuffer,
    updated: Int32Array,
    entity_byte_size: usize,
}

impl EntityTrackingSystem {
    pub fn new(buffer: SharedArrayBuffer, entity_byte_size: usize) -> Self {
        Self {
            updated: Int32Array::new_with_byte_offset_and_length(&buffer, 0, 4),
            buffer,
            entity_byte_size,
        }
    }

    pub fn write_from_buffer(&mut self, world: &mut World) {
        self.for_each(world, &mut |entity, data_view, world| {
            if let Ok((pos, vel, acc, bounds, mass)) = world.query_one_mut::<(
                &mut Position,
                &mut Velocity,
                &mut Acceleration,
                &mut Bounds,
                &mut Mass,
            )>(entity)
            {
                *pos = Position(point![
                    data_view.get_float32(POSITION_OFFSET),
                    data_view.get_float32(POSITION_OFFSET + 4)
                ]);

                *vel = Velocity(vector![
                    data_view.get_float32(VELOCITY_OFFSET),
                    data_view.get_float32(VELOCITY_OFFSET + 4)
                ]);

                *acc = Acceleration(vector![
                    data_view.get_float32(ACCELERATION_OFFSET),
                    data_view.get_float32(ACCELERATION_OFFSET + 4)
                ]);

                *bounds = Bounds(vector![
                    data_view.get_float32(BOUNDS_OFFSET),
                    data_view.get_float32(BOUNDS_OFFSET + 4)
                ]);

                *mass = Mass(data_view.get_float32(MASS_OFFSET));
            }
        });

        js_sys::Atomics::store(&self.updated, 0, 0).unwrap();
    }

    pub fn update_buffer(&mut self, world: &mut World) {
        self.for_each(world, &mut |entity, data_view, world| {
            if js_sys::Atomics::load(&self.updated, 0).unwrap() == 1 {
                return;
            }

            if let Ok((pos, vel, acc, bounds, mass)) = world.query_one_mut::<(
                &Position,
                &Velocity,
                &Acceleration,
                &Bounds,
                &Mass,
            )>(entity)
            {
                data_view.set_float32(POSITION_OFFSET, pos.x);
                data_view.set_float32(POSITION_OFFSET + 4, pos.y);

                data_view.set_float32(VELOCITY_OFFSET, vel.x);
                data_view.set_float32(VELOCITY_OFFSET + 4, vel.y);

                data_view.set_float32(ACCELERATION_OFFSET, acc.x);
                data_view.set_float32(ACCELERATION_OFFSET + 4, acc.y);

                data_view.set_float32(BOUNDS_OFFSET, bounds.x);
                data_view.set_float32(BOUNDS_OFFSET + 4, bounds.y);

                data_view.set_float32(MASS_OFFSET, mass.0);
            }
        });
    }

    pub fn execute_cmd(&mut self, world: &mut World, command: &Command) {
        match command {
            Command::SetEntity(EntityCreationParams { index, ent_type }) => {
                let mut data_view =
                    self.get_data_view(index.clone() as usize + 1 * self.entity_byte_size);

                self.remove_entity(world, &mut data_view);
                self.setup_entity(world, &mut data_view, ent_type.clone());
            }

            Command::RemoveEntity(index) => {
                self.remove_entity(
                    world,
                    &mut self.get_data_view(index.clone() as usize + 1 * self.entity_byte_size),
                );
            }

            _ => {}
        }
    }

    fn setup_entity(&self, world: &mut World, data_view: &mut DataView, entity_type: u32) {
        let entity = spawn_collidable(
            world,
            Position(point![0.0, 0.0]),
            Velocity(vector![0.0, 0.0]),
            Acceleration(vector![0.0, 0.0]),
            Bounds(vector![0.0, 0.0]),
            Mass(f32::MAX),
        );

        world.insert_one(entity, EntityType(entity_type)).unwrap();

        data_view.set_uint32(ENTITY_ID_OFFSET, entity.id());
        data_view.set_uint32(ENTITY_TYPE_OFFSET, entity_type);
    }

    fn remove_entity(&self, world: &mut World, data_view: &mut DataView) {
        if is_uninit(data_view) {
            return;
        };

        let previous_entity_id = data_view.get_uint32(4);
        unsafe {
            world
                .despawn(world.find_entity_from_id(previous_entity_id))
                .unwrap();
        };

        clear_data_view(data_view, self.entity_byte_size);
    }

    fn get_data_view(&self, byte_index: usize) -> DataView {
        DataView::new_with_shared_array_buffer(&self.buffer, byte_index, self.entity_byte_size)
    }

    fn for_each<F>(&self, world: &mut World, callback: &mut F)
    where
        F: FnMut(Entity, DataView, &mut World) -> (),
    {
        let entity_count = self.buffer.byte_length() as usize / self.entity_byte_size;
        for index in 1..entity_count {
            let byte_offset = index * self.entity_byte_size;
            let data_view = self.get_data_view(byte_offset);

            if is_uninit(&data_view) {
                continue;
            };

            let entity_id = data_view.get_uint32(ENTITY_ID_OFFSET);
            let entity = unsafe { world.find_entity_from_id(entity_id) };

            callback(entity, data_view, world);
        }
    }
}

fn clear_data_view(view: &mut DataView, size: usize) {
    for i in 0..size {
        view.set_uint8(i, 0);
    }
}

fn is_uninit(view: &DataView) -> bool {
    let entity_type = view.get_uint32(ENTITY_TYPE_OFFSET);
    return entity_type == 0;
}
