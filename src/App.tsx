import { useState, useEffect, useCallback } from "react";
import "./App.css";
import type { GameData, Unit, Turn, Hex, Season } from "./types";
import { getHexDistance, getReachableHexes } from "./utils/hexUtils";
import { HexGrid } from "./components/HexGrid";
import { UnitInfo } from "./components/UnitInfo";
import { GameLog } from "./components/GameLog";
import { TurnIndicator } from "./components/TurnIndicator";
import { useAI } from "./hooks/useAI";

function App() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [reachableHexes, setReachableHexes] = useState<Hex[]>([]);
  const [hoveredHex, setHoveredHex] = useState<Hex | null>(null);
  const [turn, setTurn] = useState<Turn>("South");
  const [year, setYear] = useState(1338);
  const [month, setMonth] = useState(3);
  const [season, setSeason] = useState<Season>("Spring");
  const [log, setLog] = useState<string>("ゲーム開始：南朝（赤）のターンです。");
  const [gameStatus, setGameStatus] = useState<"playing" | "victory" | "defeat">("playing");

  const { decideAction } = useAI(units, gameData, month);

  const isWinter = month === 12 || month <= 2;
  const isPlanting = month === 5 || month === 6;
  const isHarvest = month === 9 || month === 10;

  const getTerrainEffect = useCallback((q: number, r: number) => {
    if (!gameData) return { def: 0, mov: 1, recovery: 0, name: "平地" };
    const loc = (gameData.key_locations || []).find(l => l.coords.q === q && l.coords.r === r);
    if (loc) {
      return { 
        def: (loc.bonus as any).def || 0, 
        mov: (loc.bonus as any).mov || 1, 
        recovery: (loc.bonus as any).recovery || 0,
        name: loc.name 
      };
    }

    const tile = (gameData.map_tiles || []).find(t => t.q === q && t.r === r);
    const terrain = (tile && gameData.terrain_types) ? gameData.terrain_types[tile.type] : { name: "平地", def: 0, mov: 1 };
    return {
      def: terrain?.def || 0,
      mov: terrain?.mov || 1,
      recovery: 0,
      name: terrain?.name || "平地"
    };
  }, [gameData]);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/kyushu_nanbokucho_data.json");
        if (!response.ok) throw new Error("Data not found");
        const data: GameData = await response.json();
        
        const defaultTerrainTypes = {
          "plain": { name: "平地", color: "#aed581", mov: 1, def: 0 },
          "mountain": { name: "山岳", color: "#6d4c41", mov: 3, def: 20 },
          "forest": { name: "森林", color: "#2e7d32", mov: 2, def: 10 },
          "sea": { name: "海", color: "#81d4fa", mov: 5, def: 0 },
          "river": { name: "川", color: "#4fc3f7", mov: 2, def: -5 }
        };
        
        setGameData({
          ...data,
          terrain_types: { ...defaultTerrainTypes, ...(data.terrain_types || {}) }
        });

        const newUnits: Unit[] = [];
        const placements = data.initial_placements || [];
        data.figures.forEach((fig, i) => {
          const placement = placements.find(p => fig.name.includes(p.name) || p.name.includes(fig.name.split(" ")[0]));
          const spawnYear = fig.appearance_year || 1336;
          if ((spawnYear <= 1338 || placement) && (fig.appearance_coords || placement)) {
            const coords = placement ? { q: placement.q, r: placement.r } : fig.appearance_coords!;
            newUnits.push({
              id: i + 1, figure: fig, hex: coords,
              hp: fig.unit_stats?.hp || 50, maxHp: fig.unit_stats?.hp || 50,
              attack: fig.unit_stats?.atk || 10, defense: fig.unit_stats?.def || 5,
              hasActed: false
            });
          }
        });
        setUnits(newUnits);
      } catch (e) {
        console.error("Load error:", e);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUnitId) {
      const unit = units.find(u => u.id === selectedUnitId);
      if (unit && gameData) {
        const mov = unit.figure.unit_stats?.mov || 3;
        const hexes = getReachableHexes(
          unit.hex, 
          mov, 
          (h) => getTerrainEffect(h.q, h.r).mov, 
          units.map(u => u.hex),
          isWinter
        );
        setReachableHexes(hexes);
      }
    } else {
      setReachableHexes([]);
    }
  }, [selectedUnitId, units, gameData, isWinter]);

  const performAttack = (attacker: Unit, defender: Unit) => {
    const attackerEffect = getTerrainEffect(attacker.hex.q, attacker.hex.r);
    const defenderEffect = getTerrainEffect(defender.hex.q, defender.hex.r);
    
    // 農繁期は動員ペナルティ
    let atkBonus = (isPlanting || isHarvest) ? -5 : 0;
    let defBonus = defenderEffect.def;
    const damage = Math.max(1, (attacker.attack + atkBonus) - (defender.defense + defBonus) + Math.floor(Math.random() * 5));
    const newHp = Math.max(0, defender.hp - damage);
    setLog(`${attacker.figure.name}の攻撃！ ${defender.figure.name}に${damage}ダメージ。${(isPlanting || isHarvest) ? "(農繁期ペナルティ)" : ""}`);
    
    setUnits(units.map(u => {
      if (u.id === defender.id) return { ...u, hp: newHp };
      if (u.id === attacker.id) return { ...u, hasActed: true };
      return u;
    }).filter(u => u.hp > 0));
  };

  const performKarita = (actor: Unit) => {
    const recovery = 20;
    const newHp = Math.min(actor.maxHp, actor.hp + recovery);
    setUnits(units.map(u => u.id === actor.id ? { ...u, hp: newHp, hasActed: true } : u));
    setLog(`[${actor.figure.name}] が刈田（かりた）を行い、兵糧を現地調達して回復。`);
  };

  const performForcedMarch = (actor: Unit, hex: Hex) => {
    const damage = 10;
    const newHp = Math.max(1, actor.hp - damage);
    setUnits(units.map(u => u.id === actor.id ? { ...u, hex, hp: newHp, hasActed: true } : u));
    setLog(`[${actor.figure.name}] が強行軍を敢行！ 距離を詰めるが兵が疲弊。`);
  };

  const performMove = (actor: Unit, hex: Hex) => {
    setUnits(units.map(u => u.id === actor.id ? { ...u, hex, hasActed: true } : u));
    setLog(`[${actor.figure.name}] が移動。`);
  };

  const executeAITurn = () => {
    if (gameStatus !== "playing") return;
    const currentAIUnits = units.filter(u => {
      const faction = u.figure.faction;
      return (turn === "North" && faction.includes("北朝")) || (turn === "Third" && faction.includes("直冬")) || (turn === "Independent" && faction.includes("独立"));
    }).filter(u => !u.hasActed);
    if (currentAIUnits.length === 0) { endTurn(); return; }
    const actor = currentAIUnits[0];
    const action = decideAction(actor, units);
    if (action.type === "attack" && action.target) performAttack(actor, action.target as Unit);
    else if (action.type === "karita") performKarita(actor);
    else if (action.type === "forced_march" && action.targetHex) performForcedMarch(actor, action.targetHex);
    else if (action.type === "move" && action.targetHex) performMove(actor, action.targetHex);
    else setUnits(units.map(u => u.id === actor.id ? { ...u, hasActed: true } : u));
  };

  useEffect(() => {
    if (turn !== "South") {
      const timer = setTimeout(executeAITurn, 600);
      return () => clearTimeout(timer);
    }
  }, [turn, units]);

  const handleHexClick = (hex: Hex) => {
    if (turn !== "South" || gameStatus !== "playing") return;
    const clickedUnit = units.find(u => u.hex.q === hex.q && u.hex.r === hex.r);
    const selectedUnit = units.find(u => u.id === selectedUnitId);
    if (clickedUnit && !selectedUnit) {
      if (clickedUnit.figure.faction.includes("南朝")) {
        if (clickedUnit.hasActed) setLog("行動済みです。");
        else setSelectedUnitId(clickedUnit.id);
      }
      return;
    }
    if (selectedUnit) {
      if (clickedUnit?.id === selectedUnit.id) { setSelectedUnitId(null); return; }
      const isReachable = reachableHexes.some(h => h.q === hex.q && h.r === hex.r);
      if (clickedUnit) {
        if (getHexDistance(selectedUnit.hex, hex) <= 1 && !clickedUnit.figure.faction.includes("南朝")) {
          performAttack(selectedUnit, clickedUnit);
          setSelectedUnitId(null);
        } else setSelectedUnitId(clickedUnit.id);
      } else if (isReachable) {
        performMove(selectedUnit, hex);
        setSelectedUnitId(null);
      }
    }
  };

  const endTurn = () => {
    const turns: Turn[] = ["South", "North", "Third", "Independent"];
    const currentIndex = turns.indexOf(turn);
    if (currentIndex === turns.length - 1) {
        setMonth(prev => {
            const next = prev === 12 ? 1 : prev + 1;
            if (next === 1) setYear(y => y + 1);
            if (next >= 3 && next <= 5) setSeason("Spring");
            else if (next >= 6 && next <= 8) setSeason("Summer");
            else if (next >= 9 && next <= 11) setSeason("Autumn");
            else setSeason("Winter");
            return next;
        });
    }
    const nextTurn = turns[(currentIndex + 1) % turns.length];
    setTurn(nextTurn);
    setUnits(units.map(u => ({ ...u, hasActed: false })));
    setSelectedUnitId(null);
  };

  return (
    <div className="game-container">
      <h1>九州南北朝ヘックス戦記</h1>
      <TurnIndicator turn={turn} year={year} season={season} onEndTurn={endTurn} isPlayerTurn={turn === "South"} />
      <HexGrid gameData={gameData} units={units} selectedUnitId={selectedUnitId} reachableHexes={reachableHexes} hoveredHex={hoveredHex} onHexClick={handleHexClick} onHexHover={setHoveredHex} />
      <div className="info-panel-container">
        <GameLog log={log} />
        <div className="side-panel">
          <UnitInfo unit={units.find(u => u.id === selectedUnitId) || null} />
          {hoveredHex && <div className="terrain-info"><h4>{getTerrainEffect(hoveredHex.q, hoveredHex.r).name}</h4><p>防御: +{getTerrainEffect(hoveredHex.q, hoveredHex.r).def}</p></div>}
        </div>
      </div>
    </div>
  );
}

export default App;
