use wasm_bindgen::prelude::*;
use web_sys::Worker;

use crate::utils::{Command, EntityCreationParams, SetExtraComponentParams};

#[wasm_bindgen]
pub struct Middleman {
    worker: Worker,
}

#[wasm_bindgen]
impl Middleman {
    pub fn new(worker: Worker) -> Self {
        Self { worker }
    }

    pub fn request_entity(&self, index: u32, ent_type: u32) {
        self.send_command(Command::SetEntity(EntityCreationParams { index, ent_type }));
    }

    pub fn delete_entity(&self, index: u32) {
        self.send_command(Command::RemoveEntity(index));
    }

    pub fn set_paused(&self, paused: bool) {
        self.send_command(Command::SetPaused(paused));
    }

    pub fn set_extra_component(&self, index: u32, name: String, value: JsValue) {
        self.send_command(Command::SetExtraComponent(SetExtraComponentParams {
            index,
            name,
            val: value
        }));
    }

    fn send_command(&self, command: Command) {
        self.worker
            .post_message(&serde_wasm_bindgen::to_value(&command).unwrap())
            .unwrap()
    }
}
