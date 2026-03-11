use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet() -> String {
    "Hello from Rust/Wasm Wargame!".to_string()
}
