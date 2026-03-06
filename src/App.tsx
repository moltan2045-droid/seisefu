import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// --- Types ---
interface Figure {
  name: String;
  faction: String;
  role: String;
  actions: String[];
  stats_hint: String;
}

interface GameData {
  title: String;
  description: String;
  figures: Figure[];
  events: any[];
  key_locations: any[];
}

interface Hex {
  q: number;
  r: number;
}

interface Unit {
  id: number;
  figure: Figure;
  hex: Hex;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  hasActed: boolean;
}

// --- Constants ---
const HEX_SIZE = 30;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// --- Helper Functions ---
function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r) + CANVAS_WIDTH / 2 - 200; 
  const y = HEX_SIZE * ((3 / 2) * r) + CANVAS_HEIGHT / 2 - 150; 
  return { x, y };
}

function pixelToHex(x: number, y: number): Hex {
  const adjustedX = x - (CANVAS_WIDTH / 2 - 200);
  const adjustedY = y - (CANVAS_HEIGHT / 2 - 150);

  const q = ((Math.sqrt(3) / 3) * adjustedX - (1 / 3) * adjustedY) / HEX_SIZE;
  const r = ((2 / 3) * adjustedY) / HEX_SIZE;

  return cubeToAxial(cubeRound({ x: q, y: -q - r, z: r }));
}

function cubeRound(cube: { x: number; y: number; z: number }) {
  let rx = Math.round(cube.x);
  let ry = Math.round(cube.y);
  let rz = Math.round(cube.z);

  const x_diff = Math.abs(rx - cube.x);
  const y_diff = Math.abs(ry - cube.y);
  const z_diff = Math.abs(rz - cube.z);

  if (x_diff > y_diff && x_diff > z_diff) {
    rx = -ry - rz;
  } else if (y_diff > z_diff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { x: rx, y: ry, z: rz };
}

function cubeToAxial(cube: { x: number; y: number; z: number }): Hex {
  return { q: cube.x, r: cube.z };
}

function getHexDistance(a: Hex, b: Hex): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}


function App() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [turn, setTurn] = useState<"South" | "North">("South");
  const [log, setLog] = useState<string>("ゲーム開始：南朝（赤）のターンです。");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load Data from Rust
  useEffect(() => {
    async function loadData() {
      try {
        const data: GameData = await invoke("get_game_data");
        setGameData(data);
        
        const newUnits: Unit[] = [];
        if (data.figures.length > 0) {
            // Stats logic based on simple heuristics from name/role
            const createUnit = (figIdx: number, q: number, r: number, id: number) => {
                const fig = data.figures[figIdx];
                let atk = 10;
                let def = 5;
                let hp = 50;

                if (fig.name.includes("菊池武光")) { atk = 20; def = 8; }
                if (fig.name.includes("懐良親王")) { atk = 12; def = 12; hp = 60; } // Boss
                if (fig.name.includes("今川了俊")) { atk = 15; def = 15; hp = 60; } // Boss
                if (fig.name.includes("一色")) { atk = 10; def = 10; }
                if (fig.name.includes("少弐")) { atk = 14; def = 6; }

                return {
                    id,
                    figure: fig,
                    hex: { q, r },
                    hp,
                    maxHp: hp,
                    attack: atk,
                    defense: def,
                    hasActed: false
                };
            };

            // Initial Placement
            newUnits.push(createUnit(0, 0, 0, 1)); // 懐良親王
            newUnits.push(createUnit(1, 1, -1, 2)); // 菊池武光
            newUnits.push(createUnit(2, 5, 2, 3)); // 今川了俊
            newUnits.push(createUnit(4, 6, 1, 4)); // 一色範氏
            newUnits.push(createUnit(3, 3, 3, 5)); // 少弐頼尚
        }
        setUnits(newUnits);

      } catch (e) {
        console.error("Failed to load game data:", e);
        setLog("データ読み込みエラー: " + e);
      }
    }
    loadData();
  }, []);

  // Draw Map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Grid (Background)
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;

    for (let q = -5; q <= 10; q++) {
        for (let r = -5; r <= 10; r++) {
            if (Math.abs(q) + Math.abs(r) + Math.abs(-q-r) < 15) {
                drawHex(ctx, q, r, "#f9f9f9", "stroke");
            }
        }
    }

    // Draw Units
    units.forEach((unit) => {
        const isSouth = unit.figure.faction.includes("南朝");
        const baseColor = isSouth ? "#ffcccc" : unit.figure.faction.includes("北朝") ? "#ccccff" : "#ffffcc";
        // Darken if acted
        const color = unit.hasActed ? "#ddd" : baseColor;
        
        const isSelected = unit.id === selectedUnitId;
        drawHex(ctx, unit.hex.q, unit.hex.r, color, "fill");
        
        if (isSelected) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = "gold";
            drawHex(ctx, unit.hex.q, unit.hex.r, "", "stroke");
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#ccc";
        } else {
             drawHex(ctx, unit.hex.q, unit.hex.r, "#333", "stroke");
        }

        // Draw Name & Stats
        const center = hexToPixel(unit.hex.q, unit.hex.r);
        ctx.fillStyle = "#333";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(unit.figure.name.split(" ")[0], center.x, center.y - 5);
        
        // HP Bar
        const barWidth = 20;
        const hpPercent = unit.hp / unit.maxHp;
        ctx.fillStyle = "red";
        ctx.fillRect(center.x - barWidth/2, center.y + 5, barWidth, 4);
        ctx.fillStyle = "green";
        ctx.fillRect(center.x - barWidth/2, center.y + 5, barWidth * hpPercent, 4);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(center.x - barWidth/2, center.y + 5, barWidth, 4);

    });

  }, [units, selectedUnitId]);

  function drawHex(ctx: CanvasRenderingContext2D, q: number, r: number, color: string, mode: "fill" | "stroke") {
    const center = hexToPixel(q, r);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (2 * Math.PI / 6) * (i + 0.5); 
      const x = center.x + HEX_SIZE * Math.cos(angle);
      const y = center.y + HEX_SIZE * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    if (mode === "fill") {
        ctx.fillStyle = color;
        ctx.fill();
    } else {
        ctx.stroke();
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hex = pixelToHex(x, y);

      // Identify clicked unit
      const clickedUnit = units.find(u => u.hex.q === hex.q && u.hex.r === hex.r);
      const selectedUnit = units.find(u => u.id === selectedUnitId);

      // 1. Select Friendly Unit
      if (clickedUnit && !selectedUnit) {
          const isSouthTurn = turn === "South";
          const isUnitSouth = clickedUnit.figure.faction.includes("南朝");
          
          if ((isSouthTurn && isUnitSouth) || (!isSouthTurn && !isUnitSouth)) {
              if (clickedUnit.hasActed) {
                  setLog("そのユニットは既に行動済みです。");
              } else {
                  setSelectedUnitId(clickedUnit.id);
                  setLog(`${clickedUnit.figure.name} (HP:${clickedUnit.hp}) を選択。`);
              }
          } else {
              setLog("相手のターンです。");
          }
          return;
      }

      // 2. Action (Move or Attack) with Selected Unit
      if (selectedUnit) {
          // Deselect if clicking self or invalid
          if (clickedUnit?.id === selectedUnit.id) {
              setSelectedUnitId(null);
              setLog("選択を解除しました。");
              return;
          }

          const dist = getHexDistance(selectedUnit.hex, hex);
          if (dist > 1) {
              setLog("射程外です。");
              return;
          }

          // Attack Enemy
          if (clickedUnit) {
              const isFriendly = (selectedUnit.figure.faction.includes("南朝") && clickedUnit.figure.faction.includes("南朝")) ||
                                 (!selectedUnit.figure.faction.includes("南朝") && !clickedUnit.figure.faction.includes("北朝") && !clickedUnit.figure.faction.includes("南朝") === false); // Simplified faction check
              
              // Simplification: Just check if factions match strictly or not. 
              // Actually, let's just check if they are different factions.
              const isSameFaction = (selectedUnit.figure.faction.includes("南朝") && clickedUnit.figure.faction.includes("南朝")) ||
                                    (!selectedUnit.figure.faction.includes("南朝") && !clickedUnit.figure.faction.includes("南朝"));

              if (!isSameFaction) {
                  // COMBAT
                  const damage = Math.max(1, selectedUnit.attack - clickedUnit.defense + Math.floor(Math.random() * 5));
                  const newHp = Math.max(0, clickedUnit.hp - damage);
                  
                  setLog(`攻撃！ ${clickedUnit.figure.name} に ${damage} のダメージ！`);
                  
                  const updatedUnits = units.map(u => {
                      if (u.id === clickedUnit.id) return { ...u, hp: newHp };
                      if (u.id === selectedUnit.id) return { ...u, hasActed: true };
                      return u;
                  }).filter(u => u.hp > 0); // Remove dead

                  if (newHp === 0) setLog(`敵将 ${clickedUnit.figure.name} を討ち取りました！`);

                  setUnits(updatedUnits);
                  setSelectedUnitId(null);
              } else {
                  setLog("味方は攻撃できません。");
              }
          } 
          // Move to Empty Hex
          else {
              const updatedUnits = units.map(u => {
                  if (u.id === selectedUnit.id) return { ...u, hex: hex, hasActed: true };
                  return u;
              });
              setUnits(updatedUnits);
              setLog(`${selectedUnit.figure.name} が移動しました。`);
              setSelectedUnitId(null);
          }
      }
  };

  const endTurn = () => {
      const nextTurn = turn === "South" ? "North" : "South";
      setTurn(nextTurn);
      setLog(`${nextTurn === "South" ? "南朝" : "北朝"}軍のターン開始。`);
      
      // Reset actions
      setUnits(units.map(u => ({ ...u, hasActed: false })));
      setSelectedUnitId(null);
  };

  return (
    <div className="game-container">
      <h1>九州南北朝ヘックス戦記</h1>
      
      <div className="status-bar">
          <span className={`turn-indicator ${turn}`}>
            現在: <strong>{turn === "South" ? "南朝軍 (赤)" : "北朝軍 (青)"}</strong> のターン
          </span>
          <button onClick={endTurn} className="end-turn-btn">ターン終了</button>
      </div>

      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        onClick={handleCanvasClick}
      />

      <div className="info-panel">
        <p><strong>戦況ログ:</strong> {log}</p>
        {selectedUnitId !== null && (
            // Find unit safely
            (() => {
                const u = units.find(unit => unit.id === selectedUnitId);
                if (!u) return null;
                return (
                    <div>
                        <h3>{u.figure.name}</h3>
                        <p>HP: {u.hp}/{u.maxHp} | 攻撃: {u.attack} | 防御: {u.defense}</p>
                        <p>{u.figure.stats_hint}</p>
                    </div>
                );
            })()
        )}
      </div>
    </div>
  );
}

export default App;
