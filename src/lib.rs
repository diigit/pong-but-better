mod utils;

use wasm_bindgen::prelude::*;
use web_sys::console;

use crate::utils::set_panic_hook;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, pong-but-better!");
}

#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    
    set_panic_hook();

    console::log_1(&"Hello, world!".into());

    Ok(())
}