use wasm_bindgen::{JsValue, prelude::*};

mod collisions;
mod movement;
mod shapes;
mod render;
mod utils;
mod gameplay;
mod constants;
mod middleman;
mod entity_tracker;
mod behavior;

#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    utils::set_panic_hook();
    
    Ok(())
}

#[wasm_bindgen]
extern "C" {
    fn setInterval(closure: &Closure<dyn FnMut()>, millis: u32) -> f64;
    fn setTimeout(closure: &Closure<dyn FnMut()>, millis: u32) -> f64;
    fn queueMicrotask(closure: &Closure<dyn FnMut()>);
    
    #[wasm_bindgen(js_namespace = Math)]
    fn random() -> f64;
}