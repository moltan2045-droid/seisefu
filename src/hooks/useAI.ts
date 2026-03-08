import { Unit, GameData, Coords } from "../types";
import { getHexDistance, getNeighbors } from "../utils/hexUtils";

export const useAI = (_units: Unit[], gameData: GameData | null) => {
  
  const findBestTarget = (actor: Unit, enemies: Unit[]) => {
    const faction = actor.figure.faction;
    const isWako = faction.includes("松浦党") || faction.includes("独立");

    if (isWako && gameData) {
      // 倭寇思考：最も近い「港」または「島」の拠点を狙う（そこに敵がいてもいなくても）
      const coastalTargets = gameData.key_locations.filter(l => 
        l.terrain === "港" || l.terrain === "島"
      );
      if (coastalTargets.length > 0) {
        const bestPort = [...coastalTargets].sort((a, b) => 
          getHexDistance(actor.hex, a.coords) - getHexDistance(actor.hex, b.coords)
        )[0];
        
        // その港に敵がいるか確認
        const enemyOnPort = enemies.find(e => e.hex.q === bestPort.coords.q && e.hex.r === bestPort.coords.r);
        if (enemyOnPort) return { type: "unit", target: enemyOnPort };
        return { type: "location", target: bestPort.coords };
      }
    }

    if (enemies.length === 0) return null;

    // アーキタイプに応じたターゲット選定
    const archetype = actor.figure.ai_archetype || "default";

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

  const decideAction = (actor: Unit, allUnits: Unit[]) => {
    const factionPrefix = actor.figure.faction.split(" ")[0];
    const enemies = allUnits.filter(u => !u.figure.faction.startsWith(factionPrefix));
    
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

    // 2. 移動：ターゲットに近づく
    // アーキタイプが defender の場合、自分の拠点から離れすぎないようにする
    const archetype = actor.figure.ai_archetype || "default";
    if (archetype === "defender") {
      const homeBase = gameData?.key_locations.find(l => l.name.includes(factionPrefix))?.coords;
      if (homeBase && getHexDistance(actor.hex, homeBase) > 3) {
          return { type: "move", targetHex: homeBase };
      }
    }

    // ターゲットに近づく最適な隣接ヘックスを探す
    const neighbors = getNeighbors(actor.hex).filter(n => 
      !allUnits.some(u => u.hex.q === n.q && u.hex.r === n.r)
    );

    if (neighbors.length > 0) {
      // 海上移動が得意なユニット（倭寇など）は、海ヘックスを優先的に選ぶロジック
      const isNaval = actor.figure.unit_stats?.type === "倭寇水軍" || actor.figure.unit_stats?.type === "水軍";
      
      const bestHex = neighbors.sort((a, b) => {
        const distA = getHexDistance(a, targetHex);
        const distB = getHexDistance(b, targetHex);
        if (distA !== distB) return distA - distB;
        
        if (isNaval && gameData) {
          const tileA = gameData.map_tiles.find(t => t.q === a.q && t.r === a.r);
          const tileB = gameData.map_tiles.find(t => t.q === b.q && t.r === b.r);
          if (tileA?.type === "sea" && tileB?.type !== "sea") return -1;
          if (tileA?.type !== "sea" && tileB?.type === "sea") return 1;
        }
        return 0;
      })[0];
      
      return { type: "move", targetHex: bestHex };
    }

    return { type: "wait" };
  };

  return { decideAction };
};
