import { Unit, GameData } from "../types";
import { getHexDistance, getNeighbors } from "../utils/hexUtils";

export const useAI = (_units: Unit[], gameData: GameData | null) => {
  
  const findBestTarget = (actor: Unit, enemies: Unit[]) => {
    if (enemies.length === 0) return null;

    // アーキタイプに応じたターゲット選定
    const archetype = actor.figure.ai_archetype || "default";

    switch (archetype) {
      case "aggressive":
        // 最もHPが低い敵を狙う
        return [...enemies].sort((a, b) => a.hp - b.hp)[0];
      
      case "defender":
        // 自分の初期位置（または拠点）に近い敵を狙う
        const homeBase = gameData?.key_locations.find(l => l.name.includes(actor.figure.faction.split(" ")[0]))?.coords || actor.hex;
        return [...enemies].sort((a, b) => getHexDistance(a.hex, homeBase) - getHexDistance(b.hex, homeBase))[0];

      case "strategist":
        // 最も強力な敵（攻撃力が高い敵）を狙って弱体化させる
        return [...enemies].sort((a, b) => b.attack - a.attack)[0];

      default:
        // 最も近い敵
        return [...enemies].sort((a, b) => getHexDistance(actor.hex, a.hex) - getHexDistance(b.hex, a.hex))[0];
    }
  };

  const decideAction = (actor: Unit, allUnits: Unit[]) => {
    const factionPrefix = actor.figure.faction.split(" ")[0];
    const enemies = allUnits.filter(u => !u.figure.faction.startsWith(factionPrefix));
    
    if (enemies.length === 0) return { type: "wait" };

    const targetEnemy = findBestTarget(actor, enemies);
    if (!targetEnemy) return { type: "wait" };

    const dist = getHexDistance(actor.hex, targetEnemy.hex);

    // 1. すでに隣接しているなら攻撃
    if (dist <= 1) {
      return { type: "attack", target: targetEnemy };
    }

    // 2. 移動：ターゲットに近づく
    // アーキタイプが defender の場合、自分の拠点から離れすぎないようにする
    const archetype = actor.figure.ai_archetype || "default";
    if (archetype === "defender") {
      const homeBase = gameData?.key_locations.find(l => l.name.includes(factionPrefix))?.coords;
      if (homeBase && getHexDistance(actor.hex, homeBase) > 3) {
          // 拠点に戻る
          return { type: "move", targetHex: homeBase };
      }
    }

    // 通常の移動：ターゲットに近づく最適な隣接ヘックスを探す
    const neighbors = getNeighbors(actor.hex).filter(n => 
      !allUnits.some(u => u.hex.q === n.q && u.hex.r === n.r)
    );

    if (neighbors.length > 0) {
      const bestHex = neighbors.sort((a, b) => 
        getHexDistance(a, targetEnemy.hex) - getHexDistance(b, targetEnemy.hex)
      )[0];
      return { type: "move", targetHex: bestHex };
    }

    return { type: "wait" };
  };

  return { decideAction };
};
