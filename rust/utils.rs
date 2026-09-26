use wasm_bindgen::prelude::wasm_bindgen;
use web_sys::js_sys::Undefined;

use crate::movement::Precision;

pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct CanvasSize {
    pub x: f32,
    pub y: f32,
}

#[wasm_bindgen]
impl CanvasSize {
    pub fn new(x: Precision, y: Precision) -> Self {
        Self { x, y }
    }
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct BallSpawnArgs {
    pub count: usize,
    pub x: f32,
    pub y: f32,
}

#[wasm_bindgen]
#[derive(Clone)]
pub enum Command {
    SetPaused(bool),
    SetPlayerVelocity(f32),
    SetBotMaxSpeed(f32),
    SetBotFutureSight(f32),
    SetCanvasSize(CanvasSize),
    SpawnBall(BallSpawnArgs),
    RemoveAllBalls(Undefined),
    StartBalls(Undefined),
}
