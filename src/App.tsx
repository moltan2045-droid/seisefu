import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import type { GameData, Unit, Turn, Hex } from "./types";
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
  const [turn, setTurn] = useState<Turn>("South");
  const [log, setLog] = useState<string>("ゲーム開始：南朝（赤）のターンです。");

  const { decideAction } = useAI(units, gameData);

  const getTerrainEffect = useCallback((q: number, r: number) => {
    if (!gameData) return { def: 0, mov: 1, name: "平地" };
    const loc = (gameData.key_locations || []).find(l => l.coords.q === q && l.coords.r === r);
    if (loc) return { def: (loc.bonus as any).def || 0, mov: (loc.bonus as any).mov || 1, name: loc.name };

    const tile = (gameData.map_tiles || []).find(t => t.q === q && t.r === r);
    const terrain = (tile && gameData.terrain_types) ? gameData.terrain_types[tile.type] : { name: "平地", def: 0, mov: 1 };
    return {
      def: terrain?.def || 0,
      mov: terrain?.mov || 1,
      name: terrain?.name || "平地"
    };
  }, [gameData]);

  useEffect(() => {
    if (selectedUnitId !== null) {
      const unit = units.find(u => u.id === selectedUnitId);
      if (unit && !unit.hasActed) {
        const movement = unit.figure.unit_stats?.mov || 3;
        const otherUnitsHexes = units.filter(u => u.id !== selectedUnitId).map(u => u.hex);
        const reachable = getReachableHexes(
          unit.hex, 
          movement, 
          (h) => getTerrainEffect(h.q, h.r).mov,
          otherUnitsHexes
        );
        setReachableHexes(reachable);
      } else {
        setReachableHexes([]);
      }
    } else {
      setReachableHexes([]);
    }
  }, [selectedUnitId, units.length, getTerrainEffect]); // units.length に変更

  useEffect(() => {
    async function loadData() {
      try {
        let data: GameData;
        try {
          // Tauri環境（デスクトップアプリ）の場合
          data = await invoke("get_game_data");
        } catch (e) {
          // ブラウザのみの場合
          console.log("Tauri invoke failed, falling back to fetch...", e);
          const response = await fetch("/kyushu_nanbokucho_data.json");
          data = await response.json();
        }
        
        const defaultTerrainTypes = {
          "plain": { name: "平地", color: "#aed581", mov: 1, def: 0 },
          "mountain": { name: "山岳", color: "#6d4c41", mov: 3, def: 20 },
          "forest": { name: "森林", color: "#2e7d32", mov: 2, def: 10 },
          "sea": { name: "海", color: "#81d4fa", mov: 5, def: 0 },
          "river": { name: "川", color: "#4fc3f7", mov: 2, def: -5 }
        };

        const finalData = {
          ...data,
          terrain_types: { ...defaultTerrainTypes, ...(data.terrain_types || {}) }
        };
        
        setGameData(finalData);
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
        (data.initial_placements || []).forEach((p, i) => {
          const u = createUnit(p.name, p.q, p.r, i + 1);
          if (u) newUnits.push(u);
        });
        setUnits(newUnits);
      } catch (e) { console.error("Data loading error:", e); }
    }
    loadData();
  }, []);

  // --- AI Routine ---
  useEffect(() => {
    // プレイヤー以外のターンの場合
    if (turn !== "South") {
      // 未行動の勢力ユニットがいるか確認
      const hasUnactedUnit = units.some(u => {
        const faction = u.figure.faction;
        return (turn === "North" && faction.includes("北朝")) ||
               (turn === "Third" && faction.includes("直冬")) ||
               (turn === "Independent" && (faction.includes("独立") || faction.includes("薩摩")));
      });

      // 未行動ユニットがいる場合、またはターン終了が必要な場合
      const aiTimer = setTimeout(() => {
        executeAITurn();
      }, 800); // 思考時間 0.8s
      return () => clearTimeout(aiTimer);
    }
  }, [turn, units]); // units を監視対象に戻す

  const performAttack = (attacker: Unit, defender: Unit) => {
    const defenderEffect = getTerrainEffect(defender.hex.q, defender.hex.r);

    let atkBonus = 0;
    let defBonus = defenderEffect.def;

    const naofuyu = units.find(u => u.figure.name.includes("足利直冬"));
    if (naofuyu && attacker.figure.faction.includes("北朝") && getHexDistance(attacker.hex, naofuyu.hex) <= 3) {
      atkBonus -= 15;
      setLog("直冬の遺恨！ 北朝の攻撃力が低下中。");
    }
    if (attacker.figure.name.includes("島津氏久") && attacker.hp <= attacker.maxHp / 2) {
      atkBonus += 10;
      setLog("薩摩隼人の魂！");
    }
    const damage = Math.max(1, (attacker.attack + atkBonus) - (defender.defense + defBonus) + Math.floor(Math.random() * 5));
    const newHp = Math.max(0, defender.hp - damage);
    
    let logMsg = `${attacker.figure.name}の攻撃！ ${defender.figure.name}に${damage}ダメージ。`;
    if (defBonus !== 0) logMsg += ` (${defenderEffect.name}の地形で防御${defBonus > 0 ? "+" : ""}${defBonus})`;
    setLog(logMsg);

    setUnits(units.map(u => {
      if (u.id === defender.id) return { ...u, hp: newHp };
      if (u.id === attacker.id) return { ...u, hasActed: true };
      return u;
    }).filter(u => u.hp > 0));
  };

  const performMove = (actor: Unit, hex: Hex) => {
    setUnits(units.map(u => u.id === actor.id ? { ...u, hex, hasActed: true } : u));
    setLog(`[${actor.figure.name}] が移動。`);
  };

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
    const action = decideAction(actor, units);

    if (action.type === "attack" && action.target) {
      performAttack(actor, action.target as Unit);
    } else if (action.type === "move" && action.targetHex) {
      performMove(actor, action.targetHex);
    } else {
      setUnits(units.map(u => u.id === actor.id ? { ...u, hasActed: true } : u));
    }
  };

  const handleHexClick = (hex: Hex) => {
    if (turn !== "South") return;
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
      
      const isReachable = reachableHexes.some(h => h.q === hex.q && h.r === hex.r);
      const dist = getHexDistance(selectedUnit.hex, hex);

      if (clickedUnit) {
        if (clickedUnit.figure.faction.includes("南朝")) { 
          setSelectedUnitId(clickedUnit.id); 
          setLog(`${clickedUnit.figure.name}を選択。`); 
          return; 
        }
        if (dist > 1) { setLog("射程外です。"); return; }
        performAttack(selectedUnit, clickedUnit);
        setSelectedUnitId(null);
      } else {
        if (!isReachable) { setLog("移動可能範囲外です。"); return; }
        performMove(selectedUnit, hex);
        setSelectedUnitId(null);
      }
    }
  };

  const endTurn = () => {
    const turns: Turn[] = ["South", "North", "Third", "Independent"];
    const nextTurn = turns[(turns.indexOf(turn) + 1) % turns.length];
    setTurn(nextTurn);
    setUnits(units.map(u => ({ ...u, hasActed: false })));
    setSelectedUnitId(null);
    setReachableHexes([]);
  };

  return (
    <div className="game-container">
      <h1>九州南北朝ヘックス戦記</h1>
      
      <TurnIndicator 
        turn={turn} 
        onEndTurn={endTurn} 
        isPlayerTurn={turn === "South"} 
      />

      <HexGrid 
        gameData={gameData}
        units={units}
        selectedUnitId={selectedUnitId}
        reachableHexes={reachableHexes}
        onHexClick={handleHexClick}
      />

      <div className="info-panel-container">
        <GameLog log={log} />
        <UnitInfo unit={units.find(u => u.id === selectedUnitId) || null} />
      </div>
    </div>
  );
}

export default App;
