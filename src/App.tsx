import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// --- Types ---
interface Figure {
  name: string;
  faction: string;
  role: string;
  unit_stats?: { hp: number; atk: number; def: number; mov: number; rng: number };
  special_skill: string;
  actions: string[];
  stats_hint: string;
  ai_archetype?: string;
}

interface GameData {
  title: string;
  description: string;
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

type Turn = "South" | "North" | "Third" | "Independent";

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
  if (x_diff > y_diff && x_diff > z_diff) rx = -ry - rz;
  else if (y_diff > z_diff) ry = -rx - rz;
  else rz = -rx - ry;
  return { x: rx, y: ry, z: rz };
}

function cubeToAxial(cube: { x: number; y: number; z: number }): Hex {
  return { q: cube.x, r: cube.z };
}

function getHexDistance(a: Hex, b: Hex): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

function getNeighbors(h: Hex): Hex[] {
    const dirs = [
        {q: 1, r: 0}, {q: 1, r: -1}, {q: 0, r: -1},
        {q: -1, r: 0}, {q: -1, r: 1}, {q: 0, r: 1}
    ];
    return dirs.map(d => ({ q: h.q + d.q, r: h.r + d.r }));
}

function App() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [turn, setTurn] = useState<Turn>("South");
  const [log, setLog] = useState<string>("ゲーム開始：南朝（赤）のターンです。");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data: GameData = await invoke("get_game_data");
        setGameData(data);
        const newUnits: Unit[] = [];
        const createUnit = (name: string, q: number, r: number, id: number) => {
            const fig = data.figures.find(f => f.name.includes(name));
            if (!fig) return null;
            return {
                id, figure: fig, hex: { q, r },
                hp: fig.unit_stats?.hp || 50, maxHp: fig.unit_stats?.hp || 50,
                attack: fig.unit_stats?.atk || 10, defense: fig.unit_stats?.def || 5,
                hasActed: false
            };
        };
        const placements = [
            { name: "懐良親王", q: 0, r: 0 }, { name: "菊池武光", q: 1, r: -1 }, { name: "阿蘇惟澄", q: 1, r: 1 },
            { name: "今川了俊", q: 5, r: 2 }, { name: "大友氏時", q: 6, r: 3 },
            { name: "足利直冬", q: 8, r: 0 }, { name: "足利隆冬", q: 8, r: 1 },
            { name: "島津氏久", q: 0, r: 5 }, { name: "少弐頼尚", q: 4, r: 3 }
        ];
        placements.forEach((p, i) => {
            const u = createUnit(p.name, p.q, p.r, i + 1);
            if (u) newUnits.push(u);
        });
        setUnits(newUnits);
      } catch (e) { console.error(e); }
    }
    loadData();
  }, []);

  // --- AI Routine ---
  useEffect(() => {
    if (turn !== "South") {
        const aiTimer = setTimeout(() => {
            executeAITurn();
        }, 1000);
        return () => clearTimeout(aiTimer);
    }
  }, [turn, units]);

  const executeAITurn = () => {
      const currentAIUnits = units.filter(u => {
          const faction = u.figure.faction;
          const isMyTurn = (turn === "North" && faction.includes("北朝")) ||
                           (turn === "Third" && faction.includes("直冬")) ||
                           (turn === "Independent" && (faction.includes("独立") || faction.includes("薩摩")));
          return isMyTurn && !u.hasActed;
      });

      if (currentAIUnits.length === 0) {
          endTurn();
          return;
      }

      const actor = currentAIUnits[0];
      
      // AI意思決定ロジック
      // 1. 隣接する敵がいれば攻撃
      const enemies = units.filter(u => !u.figure.faction.includes(actor.figure.faction.split(" ")[0]));
      const adjacentEnemy = enemies.find(e => getHexDistance(actor.hex, e.hex) <= 1);

      if (adjacentEnemy) {
          performAttack(actor, adjacentEnemy);
      } else {
          // 2. 移動：一番近い敵に近づく
          const targetEnemy = enemies.sort((a, b) => getHexDistance(actor.hex, a.hex) - getHexDistance(actor.hex, b.hex))[0];
          const targetHex = targetEnemy ? targetEnemy.hex : { q: 0, r: 0 };
          const neighbors = getNeighbors(actor.hex).filter(n => !units.some(u => u.hex.q === n.q && u.hex.r === n.r));
          
          if (neighbors.length > 0) {
              const bestHex = neighbors.sort((a, b) => getHexDistance(a, targetHex) - getHexDistance(b, targetHex))[0];
              performMove(actor, bestHex);
          } else {
              setUnits(units.map(u => u.id === actor.id ? { ...u, hasActed: true } : u));
          }
      }
  };

  const performAttack = (attacker: Unit, defender: Unit) => {
      let atkBonus = 0;
      const naofuyu = units.find(u => u.figure.name.includes("足利直冬"));
      if (naofuyu && attacker.figure.faction.includes("北朝") && getHexDistance(attacker.hex, naofuyu.hex) <= 3) {
          atkBonus -= 15;
          setLog("直冬の遺恨！ 北朝の攻撃力が低下中。");
      }
      if (attacker.figure.name.includes("島津氏久") && attacker.hp <= attacker.maxHp / 2) {
          atkBonus += 10;
          setLog("薩摩隼人の魂！");
      }
      const damage = Math.max(1, (attacker.attack + atkBonus) - defender.defense + Math.floor(Math.random() * 5));
      const newHp = Math.max(0, defender.hp - damage);
      setLog(`AI[${attacker.figure.name}]の攻撃！ ${defender.figure.name}に${damage}ダメージ。`);
      setUnits(units.map(u => {
          if (u.id === defender.id) return { ...u, hp: newHp };
          if (u.id === attacker.id) return { ...u, hasActed: true };
          return u;
      }).filter(u => u.hp > 0));
  };

  const performMove = (actor: Unit, hex: Hex) => {
      const isLanding = hex.q >= 3 && actor.hex.q < 3;
      if (isLanding) {
          let dice = Math.floor(Math.random() * 6) + 1;
          setLog(`AI[${actor.figure.name}] 上陸ダイス：${dice}`);
          if (actor.figure.name.includes("足利隆冬") && dice <= 2) {
              dice = Math.floor(Math.random() * 6) + 1;
              setLog(`鎮西の執念(AI)！ 振り直し：${dice}`);
          }
          if (dice <= 2) {
              setLog(`AI[${actor.figure.name}] 上陸失敗。`);
              setUnits(units.map(u => u.id === actor.id ? { ...u, hasActed: true } : u));
          } else {
              let atkBuff = actor.figure.name.includes("足利隆冬") ? 15 : 0;
              setUnits(units.map(u => u.id === actor.id ? { ...u, hex, attack: u.attack + atkBuff, hasActed: true } : u));
              setLog(`AI[${actor.figure.name}] 上陸成功！`);
          }
      } else {
          setUnits(units.map(u => u.id === actor.id ? { ...u, hex, hasActed: true } : u));
          setLog(`AI[${actor.figure.name}] が移動。`);
      }
  };

  // --- Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for (let q = -5; q <= 10; q++) {
        for (let r = -5; r <= 10; r++) {
            if (Math.abs(q) + Math.abs(r) + Math.abs(-q-r) < 20) {
                let color = "#f9f9f9";
                const loc = gameData.key_locations.find(l => l.coords.q === q && l.coords.r === r);
                if (loc) color = "#eee";
                drawHex(ctx, q, r, color, "fill");
                if (loc) {
                    const center = hexToPixel(q, r);
                    ctx.fillStyle = "#999";
                    ctx.font = "8px sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText(loc.name, center.x, center.y + 15);
                }
            }
        }
    }
    units.forEach((unit) => {
        let baseColor = "#ffffcc";
        if (unit.figure.faction.includes("南朝")) baseColor = "#ffcccc";
        if (unit.figure.faction.includes("北朝")) baseColor = "#ccccff";
        if (unit.figure.faction.includes("直冬派")) baseColor = "#ffff99";
        const color = unit.hasActed ? "#bbb" : baseColor;
        const isSelected = unit.id === selectedUnitId;
        drawHex(ctx, unit.hex.q, unit.hex.r, color, "fill");
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.strokeStyle = isSelected ? "gold" : "#333";
        drawHex(ctx, unit.hex.q, unit.hex.r, "", "stroke");
        const center = hexToPixel(unit.hex.q, unit.hex.r);
        ctx.fillStyle = "#333";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(unit.figure.name.split(" ")[0], center.x, center.y - 5);
        const barWidth = 20;
        const hpPercent = unit.hp / unit.maxHp;
        ctx.fillStyle = "red"; ctx.fillRect(center.x - barWidth/2, center.y + 5, barWidth, 4);
        ctx.fillStyle = "green"; ctx.fillRect(center.x - barWidth/2, center.y + 5, barWidth * hpPercent, 4);
        ctx.strokeRect(center.x - barWidth/2, center.y + 5, barWidth, 4);
    });
  }, [units, selectedUnitId, gameData]);

  function drawHex(ctx: CanvasRenderingContext2D, q: number, r: number, color: string, mode: "fill" | "stroke") {
    const center = hexToPixel(q, r);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (2 * Math.PI / 6) * (i + 0.5); 
      const x = center.x + HEX_SIZE * Math.cos(angle);
      const y = center.y + HEX_SIZE * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (mode === "fill") { ctx.fillStyle = color; ctx.fill(); } else ctx.stroke();
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (turn !== "South") return; // プレイヤーは南朝ターンのみ操作可能
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hex = pixelToHex(x, y);
      const clickedUnit = units.find(u => u.hex.q === hex.q && u.hex.r === hex.r);
      const selectedUnit = units.find(u => u.id === selectedUnitId);

      if (clickedUnit && !selectedUnit) {
          if (clickedUnit.figure.faction.includes("南朝")) {
              if (clickedUnit.hasActed) setLog("行動済みです。");
              else { setSelectedUnitId(clickedUnit.id); setLog(`${clickedUnit.figure.name}を選択。`); }
          } else setLog("他勢力のターンです。");
          return;
      }
      if (selectedUnit) {
          if (clickedUnit?.id === selectedUnit.id) { setSelectedUnitId(null); return; }
          const dist = getHexDistance(selectedUnit.hex, hex);
          if (dist > 1) { setLog("射程外です。"); return; }
          if (clickedUnit) {
              if (clickedUnit.figure.faction.includes("南朝")) { setLog("味方は攻撃できません。"); return; }
              performAttack(selectedUnit, clickedUnit);
              setSelectedUnitId(null);
          } else {
              performMove(selectedUnit, hex);
              setSelectedUnitId(null);
          }
      }
  };

  const endTurn = () => {
      const turns: Turn[] = ["South", "North", "Third", "Independent"];
      const nextTurn = turns[(turns.indexOf(turn) + 1) % turns.length];
      setTurn(nextTurn);
      const names = { South: "南朝", North: "北朝", Third: "直冬派", Independent: "独立勢力" };
      setLog(`${names[nextTurn]}軍のターン開始。`);
      setUnits(units.map(u => ({ ...u, hasActed: false })));
      setSelectedUnitId(null);
  };

  return (
    <div className="game-container">
      <h1>九州南北朝ヘックス戦記</h1>
      <div className="status-bar">
          <span className={`turn-indicator ${turn}`}>現在: <strong>{turn}</strong> ターン</span>
          <button onClick={endTurn} className="end-turn-btn" disabled={turn !== "South"}>ターン終了</button>
      </div>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onClick={handleCanvasClick} />
      <div className="info-panel">
        <p><strong>戦況ログ:</strong> {log}</p>
        {selectedUnitId !== null && (() => {
            const u = units.find(unit => unit.id === selectedUnitId);
            if (!u) return null;
            return (
                <div className="unit-detail">
                    <h3>{u.figure.name} ({u.figure.faction})</h3>
                    <p>HP: {u.hp}/{u.maxHp} | ATK: {u.attack} | DEF: {u.defense}</p>
                    <p><i>{u.figure.special_skill}</i></p>
                    <p>{u.figure.stats_hint}</p>
                </div>
            );
        })()}
      </div>
    </div>
  );
}
export default App;
