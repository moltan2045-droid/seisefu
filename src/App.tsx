import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import type { GameData, Unit, Turn, Hex } from "./types";
import { getHexDistance } from "./utils/hexUtils";
import { HexGrid } from "./components/HexGrid";
import { UnitInfo } from "./components/UnitInfo";
import { GameLog } from "./components/GameLog";
import { TurnIndicator } from "./components/TurnIndicator";
import { useAI } from "./hooks/useAI";

function App() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [turn, setTurn] = useState<Turn>("South");
  const [log, setLog] = useState<string>("ゲーム開始：南朝（赤）のターンです。");

  const { decideAction } = useAI(units, gameData);

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
        data.initial_placements.forEach((p, i) => {
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
    const action = decideAction(actor, units);

    if (action.type === "attack" && action.target) {
      performAttack(actor, action.target);
    } else if (action.type === "move" && action.targetHex) {
      performMove(actor, action.targetHex);
    } else {
      setUnits(units.map(u => u.id === actor.id ? { ...u, hasActed: true } : u));
    }
  };

  const performAttack = (attacker: Unit, defender: Unit) => {
    const attackerLoc = gameData?.key_locations.find(l => l.coords.q === attacker.hex.q && l.coords.r === attacker.hex.r);
    const defenderLoc = gameData?.key_locations.find(l => l.coords.q === defender.hex.q && l.coords.r === defender.hex.r);

    let atkBonus = attackerLoc?.bonus.atk || 0;
    let defBonus = defenderLoc?.bonus.def || 0;

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
    if (defenderLoc) logMsg += ` (${defenderLoc.name}の地形で防御+${defenderLoc.bonus.def})`;
    setLog(logMsg);

    setUnits(units.map(u => {
      if (u.id === defender.id) return { ...u, hp: newHp };
      if (u.id === attacker.id) return { ...u, hasActed: true };
      return u;
    }).filter(u => u.hp > 0));
  };

  const performMove = (actor: Unit, hex: Hex) => {
    const targetLoc = gameData?.key_locations.find(l => l.coords.q === hex.q && l.coords.r === hex.r);
    
    // 川などの移動コストが高い地形への進入判定 (簡易的な成否判定)
    if (targetLoc && targetLoc.bonus.mov > 2) {
      let dice = Math.floor(Math.random() * 6) + 1;
      setLog(`[${actor.figure.name}] ${targetLoc.name}への進入ダイス：${dice}`);
      
      if (actor.figure.name.includes("足利隆冬") && dice <= 2) {
        dice = Math.floor(Math.random() * 6) + 1;
        setLog(`鎮西の執念！ 振り直し：${dice}`);
      }
      
      if (dice <= 2) {
        setLog(`[${actor.figure.name}] ${targetLoc.name}への進入失敗。`);
        setUnits(units.map(u => u.id === actor.id ? { ...u, hasActed: true } : u));
        return;
      } else {
        setLog(`[${actor.figure.name}] ${targetLoc.name}へ進出成功！`);
      }
    }

    setUnits(units.map(u => u.id === actor.id ? { ...u, hex, hasActed: true } : u));
    setLog(`[${actor.figure.name}] が移動。`);
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
    setUnits(units.map(u => ({ ...u, hasActed: false })));
    setSelectedUnitId(null);
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
