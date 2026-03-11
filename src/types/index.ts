// --- Backend Data Types (Synced with src-tauri/src/lib.rs) ---

export interface UnitStats {
  type: string;
  hp: number;
  atk: number;
  def: number;
  mov: number;
  rng: number;
}

export interface Vassal {
  name: string;
  power: number;
  role: string;
}

export interface Figure {
  name: string;
  faction: string;
  role: string;
  unit_stats?: UnitStats;
  special_skill: string;
  actions: string[];
  stats_hint: string;
  ai_archetype?: string;
  appearance_year?: number;
  appearance_coords?: Coords;
  vassals?: Vassal[];
}

export interface Event {
  year: number;
  name: string;
  description: string;
  impact?: string;
}

export interface Coords {
  q: number;
  r: number;
}

// Alias for Coords as Hex (Axial Coordinate)
export type Hex = Coords;

export interface TerrainType {
  name: string;
  color: string;
  mov: number;
  def: number;
}

export interface MapTile {
  q: number;
  r: number;
  type: string;
}

export interface TerrainBonus {
  def: number;
  atk: number;
  mov: number;
  recovery: number;
}

export interface Location {
  name: string;
  coords: Coords;
  terrain: string;
  bonus: TerrainBonus;
  description: string;
}

export interface InitialPlacement {
  name: string;
  q: number;
  r: number;
}

export interface GameData {
  title: string;
  description: string;
  figures: Figure[];
  events: Event[];
  terrain_types: Record<string, TerrainType>;
  map_tiles: MapTile[];
  key_locations: Location[];
  initial_placements: InitialPlacement[];
}

// --- Frontend Logic Types ---

export interface Unit {
  id: number;
  figure: Figure;
  hex: Hex;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  hasActed: boolean;
}

export type Turn = "South" | "North" | "Third" | "Independent";

export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

export interface GameState {
  year: number;
  season: Season;
  turn: Turn;
  log: string[];
}

export interface Pixel {
  x: number;
  y: number;
}
