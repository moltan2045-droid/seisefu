use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager};
use tauri::path::BaseDirectory;

// --- Data Structures ---

#[derive(Serialize, Deserialize, Debug, Clone)]
struct UnitStats {
    #[serde(rename = "type")]
    unit_type: String,
    hp: i32,
    atk: i32,
    def: i32,
    mov: i32,
    rng: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Figure {
    name: String,
    faction: String,
    role: String,
    unit_stats: Option<UnitStats>,
    special_skill: String,
    actions: Vec<String>,
    stats_hint: String,
    ai_archetype: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Event {
    year: i32,
    name: String,
    description: String,
    impact: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Coords {
    q: i32,
    r: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct TerrainBonus {
    def: i32,
    atk: i32,
    mov: i32,
    recovery: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Location {
    name: String,
    coords: Coords,
    terrain: String,
    bonus: TerrainBonus,
    description: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct InitialPlacement {
    name: String,
    q: i32,
    r: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct GameData {
    title: String,
    description: String,
    figures: Vec<Figure>,
    events: Vec<Event>,
    key_locations: Vec<Location>,
    initial_placements: Vec<InitialPlacement>,
}

// --- Command Handler ---

#[tauri::command]
fn get_game_data(app: AppHandle) -> Result<GameData, String> {
    let resource_path = app.path().resolve("data.json", BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve resource path: {}", e))?;

    let data_str = fs::read_to_string(&resource_path)
        .map_err(|e| format!("Failed to read file at {:?}: {}", resource_path, e))?;

    let data: GameData = serde_json::from_str(&data_str)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    Ok(data)
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_game_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
