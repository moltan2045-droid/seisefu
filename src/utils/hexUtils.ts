import { Hex, Pixel } from "../types";

export const HEX_SIZE = 35;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 700;

export function hexToPixel(q: number, r: number): Pixel {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r) + CANVAS_WIDTH / 2 - 150;
  const y = HEX_SIZE * ((3 / 2) * r) + CANVAS_HEIGHT / 2 - 200;
  return { x, y };
}

export function pixelToHex(x: number, y: number): Hex {
  const adjustedX = x - (CANVAS_WIDTH / 2 - 150);
  const adjustedY = y - (CANVAS_HEIGHT / 2 - 200);
  const q = ((Math.sqrt(3) / 3) * adjustedX - (1 / 3) * adjustedY) / HEX_SIZE;
  const r = ((2 / 3) * adjustedY) / HEX_SIZE;
  return cubeToAxial(cubeRound({ x: q, y: -q - r, z: r }));
}

export function cubeRound(cube: { x: number; y: number; z: number }) {
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

export function cubeToAxial(cube: { x: number; y: number; z: number }): Hex {
  return { q: cube.x, r: cube.z };
}

export function getHexDistance(a: Hex, b: Hex): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function getNeighbors(h: Hex): Hex[] {
  const dirs = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
  ];
  return dirs.map(d => ({ q: h.q + d.q, r: h.r + d.r }));
}

export function getReachableHexes(
  start: Hex, 
  movement: number, 
  getCost: (h: Hex) => number,
  occupiedHexes: Hex[]
): Hex[] {
  const visited: Record<string, number> = {};
  const reachable: Hex[] = [];
  const queue: { hex: Hex; cost: number }[] = [{ hex: start, cost: 0 }];

  visited[`${start.q},${start.r}`] = 0;

  while (queue.length > 0) {
    const { hex, cost } = queue.shift()!;
    
    if (cost > 0) {
      reachable.push(hex);
    }

    const neighbors = getNeighbors(hex);
    for (const neighbor of neighbors) {
      const terrainCost = getCost(neighbor);
      // 通行不能な地形（コストが非常に高い、または負の値など）を考慮
      if (terrainCost < 0 || terrainCost > movement) continue;
      
      const newCost = cost + terrainCost;
      if (newCost <= movement) {
        const key = `${neighbor.q},${neighbor.r}`;
        // 既に訪問済みで、より低いコストで到達可能な場合はスキップ
        if (visited[key] === undefined || newCost < visited[key]) {
          // 他のユニットがいるマスは通過可能だが、そこを目的地にはできない（ゲームルールにより調整可能）
          // 今回は「通過可能だが止まれない」ではなく、シンプルに「他ユニットがいるマスは除外」する。
          const isOccupied = occupiedHexes.some(o => o.q === neighbor.q && o.r === neighbor.r);
          
          visited[key] = newCost;
          if (!isOccupied) {
            queue.push({ hex: neighbor, cost: newCost });
          } else {
            // 他ユニットがいるマスは通過はできるが止まれない仕様にする場合：
            // queue.push({ hex: neighbor, cost: newCost });
            // ただし reachable には追加しないように調整が必要。
            // ここではシンプルに「他ユニットがいるマスは進入不可」として扱う。
          }
        }
      }
    }
  }

  return reachable;
}
