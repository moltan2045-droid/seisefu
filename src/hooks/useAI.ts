import { Unit, GameData, Coords, Season } from "../types";
import { getHexDistance, getNeighbors, getReachableHexes } from "../utils/hexUtils";

export const useAI = (allUnits: Unit[], gameData: GameData | null, currentMonth: number) => {
  
  const findBestTarget = (actor: Unit, enemies: Unit[]) => {
    const faction = actor.figure.faction;
    const isWako = faction.includes("松浦党") || faction.includes("独立");
    const isAutumn = currentMonth === 9 || currentMonth === 10;
    const isPlanting = currentMonth === 5 || currentMonth === 6;

    // 1. 低HPまたは秋季の場合、「刈田（Karita）」を検討
    if (actor.hp < (actor.maxHp * 0.4) || isAutumn) {
        const foodSources = gameData?.map_tiles.filter(t => t.type === "plain") || [];
        if (foodSources.length > 0) {
            const bestField = [...foodSources]
                .sort((a, b) => getHexDistance(actor.hex, a) - getHexDistance(actor.hex, b))[0];
            if (getHexDistance(actor.hex, bestField) < 3) {
                return { type: "location", target: { q: bestField.q, r: bestField.r }, action: "karita" };
            }
        }
    }

    if (isWako && gameData) {
      // 倭寇思考：最も近い「港」または「島」の拠点を狙う
      const coastalTargets = gameData.key_locations.filter(l => 
        l.terrain === "港" || l.terrain === "島"
      );
      if (coastalTargets.length > 0) {
        const bestPort = [...coastalTargets].sort((a, b) => 
          getHexDistance(actor.hex, a.coords) - getHexDistance(actor.hex, b.coords)
        )[0];
        
        const enemyOnPort = enemies.find(e => e.hex.q === bestPort.coords.q && e.hex.r === bestPort.coords.r);
        if (enemyOnPort) return { type: "unit", target: enemyOnPort };
        return { type: "location", target: bestPort.coords };
      }
    }

    if (enemies.length === 0) return null;

    // 農繁期（田植え・稲刈り）は、防衛的なターゲット選定
    const archetype = (isPlanting || isAutumn) ? "defender" : (actor.figure.ai_archetype || "default");

    switch (archetype) {
      case "aggressive":
        return { type: "unit", target: [...enemies].sort((a, b) => a.hp - b.hp)[0] };
      
      case "defender":
        const homeBase = gameData?.key_locations.find(l => l.name.includes(actor.figure.faction.split(" ")[0]))?.coords || actor.hex;
        return { type: "unit", target: [...enemies].sort((a, b) => getHexDistance(a.hex, homeBase) - getHexDistance(b.hex, homeBase))[0] };

      case "strategist":
        return { type: "unit", target: [...enemies].sort((a, b) => b.attack - a.attack)[0] };

      default:
        return { type: "unit", target: [...enemies].sort((a, b) => getHexDistance(actor.hex, a.hex) - getHexDistance(b.hex, a.hex))[0] };
    }
  };

  const decideAction = (actor: Unit, units: Unit[]) => {
    const factionPrefix = actor.figure.faction.split(" ")[0];
    const enemies = units.filter(u => !u.figure.faction.startsWith(factionPrefix));
    
    const targetResult = findBestTarget(actor, enemies);
    if (!targetResult) return { type: "wait" };

    const targetHex = targetResult.type === "unit" 
      ? (targetResult.target as Unit).hex 
      : (targetResult.target as Coords);
    const dist = getHexDistance(actor.hex, targetHex);

    // 1. ユニットターゲットで隣接しているなら攻撃
    if (targetResult.type === "unit" && dist <= 1) {
      return { type: "attack", target: targetResult.target };
    }

    // 2. 刈田アクション（特定のヘックスに到達して回復）
    if ((targetResult as any).action === "karita" && dist === 0) {
        return { type: "karita" };
    }

    // 3. 移動：強行軍 (Forced March) の検討
    // 通常の移動距離
    const normalMov = actor.figure.unit_stats?.mov || 3;
    const canForcedMarch = actor.hp > (actor.maxHp * 0.6); // 体力がある時のみ可能
    
    // 目的地に近づくための移動
    const neighbors = getNeighbors(actor.hex).filter(n => 
      !units.some(u => u.hex.q === n.q && u.hex.r === n.r)
    );

    if (neighbors.length > 0) {
      const bestHex = neighbors.sort((a, b) => getHexDistance(a, targetHex) - getHexDistance(b, targetHex))[0];
      
      // 強行軍のメリット：一気に距離を詰めて攻撃圏内に入る
      if (canForcedMarch && getHexDistance(bestHex, targetHex) > 1 && dist > normalMov) {
          return { type: "forced_march", targetHex: bestHex };
      }

      return { type: "move", targetHex: bestHex };
    }

    return { type: "wait" };
  };

  return { decideAction };
};
