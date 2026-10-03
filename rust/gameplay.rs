use hecs::World;
use std::{cell::RefCell, rc::Rc};
use wasm_bindgen::{convert::TryFromJsValue, prelude::*};
use web_sys::{
    DedicatedWorkerGlobalScope, MessageEvent, OffscreenCanvas,
    js_sys::{self, Float32Array, SharedArrayBuffer, Uint16Array},
};

use crate::{
    behavior, collisions::self, constants::SIMULATION_STEP_RATE, entity_tracker::EntityTrackingSystem, movement::*, render::RenderSystem, utils::*,
};

#[wasm_bindgen]
pub fn run_within_worker(
    vertex_array: Float32Array,
    index_array: Uint16Array,
    entity_data: SharedArrayBuffer,
    entity_byte_size: usize,
    on_canvas_change: js_sys::Function,
) -> ScopedClosure<'static, dyn FnMut()> {
    let global = js_sys::global().unchecked_into::<DedicatedWorkerGlobalScope>();
    let performance = global
        .performance()
        .expect("Unabled to find performance object in worker.");

    let command_buf_ref: Rc<RefCell<Vec<Command>>> = Rc::new(RefCell::new(Vec::new()));

    {
        let command_buf_ref = Rc::clone(&command_buf_ref);
        let message_handler: ScopedClosure<'static, dyn FnMut(MessageEvent)> =
            Closure::new(move |event: MessageEvent| {
                if let Ok(cmd) = serde_wasm_bindgen::from_value::<Command>(event.data()) {
                    command_buf_ref.borrow_mut().push(cmd);
                } else if let Ok(canvas) = OffscreenCanvas::try_from_js_value(event.data()) {
                    on_canvas_change.call1(&JsValue::null(), &canvas).unwrap();
                } else if event.data() == JsValue::from_str("remove canvas") {
                    on_canvas_change
                        .call1(&JsValue::null(), &JsValue::undefined())
                        .unwrap();
                }
            });

        global.set_onmessage(Some(message_handler.as_ref().unchecked_ref()));

        message_handler.forget();
    }
    
    let global_clone = global.clone();
    let mut world = World::new();

    let mut triangulation_sys = RenderSystem::new(vertex_array, index_array);
    let mut entity_tracker = EntityTrackingSystem::new(entity_data.clone(), entity_byte_size);
    
    let mut time_last = performance.now();
    let gameplay_loop = move || {
        let time_now = performance.now();
        let time_delta = ((time_now - time_last) / 1000.0) as f32;
        if time_delta < 1.0 / SIMULATION_STEP_RATE { return; }
        time_last = time_now;

        entity_tracker.write_from_buffer(&mut world);

        if let Ok(mut commands) = command_buf_ref.try_borrow_mut() {
            let mut do_fire_entites_created = false;

            for cmd in commands.iter() {
                entity_tracker.execute_cmd(&mut world, cmd);

                if let Command::SetEntity(_) = cmd {
                    do_fire_entites_created = true;
                }
            }

            if do_fire_entites_created {
                global_clone
                    .post_message(&JsValue::from("entity created"))
                    .unwrap();
            }

            commands.clear();
        }

        run_movement(&mut world, time_delta);
        collisions::run_collisions(&mut world);
        behavior::run_behaviors(&mut world);

        if let Some(colliding_entities) = collisions::get_collisions(&mut world) {
            global_clone.post_message(&colliding_entities).unwrap();
        }

        entity_tracker.update_buffer(&mut world);

        // TODO: not run this every game step, rather run it before every render.
        triangulation_sys.run_triangulation(&mut world);
    };

    global.post_message(&JsValue::from(entity_data)).unwrap();

    return Closure::own(gameplay_loop);
}
