import { Hex, Pixel } from "../types";

export const HEX_SIZE = 25; // 少し大きくして見やすく
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 700;

export const hexToPixel = (q: number, r: number): Pixel => {
  // 九州の中心座標 (q: 3, r: 2 付近) を画面中央に持ってくる
  const offsetX = CANVAS_WIDTH / 2 - 150; 
  const offsetY = CANVAS_HEIGHT / 2 - 150;
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r) + offsetX;
  const y = HEX_SIZE * ((3 / 2) * r) + offsetY;
  return { x, y };
};

export const pixelToHex = (x: number, y: number): Hex => {
  const offsetX = CANVAS_WIDTH / 2 - 150;
  const offsetY = CANVAS_HEIGHT / 2 - 150;
  const adjustedX = x - offsetX;
  const adjustedY = y - offsetY;
  const q = ((Math.sqrt(3) / 3) * adjustedX - (1 / 3) * adjustedY) / HEX_SIZE;
  const r = ((2 / 3) * adjustedY) / HEX_SIZE;
  return cubeToAxial(cubeRound({ x: q, y: -q - r, z: r }));
};


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
  occupiedHexes: Hex[],
  isWinter: boolean = false
): Hex[] {
  const visited: Record<string, number> = {};
  const reachable: { hex: Hex; cost: number }[] = [];
  const queue: { hex: Hex; cost: number }[] = [{ hex: start, cost: 0 }];

  visited[`${start.q},${start.r}`] = 0;

  while (queue.length > 0) {
    const { hex, cost } = queue.shift()!;
    
    if (cost > 0) {
      reachable.push({ hex, cost });
    }

    const neighbors = getNeighbors(hex);
    for (const neighbor of neighbors) {
      let terrainCost = getCost(neighbor);
      
      // 冬季の山岳ペナルティ (system_rules に基づく)
      if (isWinter && terrainCost >= 3) {
        terrainCost += 2; // 山岳コストがさらに増加
      }

      if (terrainCost < 0 || terrainCost > 10) continue; // 通行不能な地形
      
      const newCost = cost + terrainCost;
      if (newCost <= movement) {
        const key = `${neighbor.q},${neighbor.r}`;
        const isOccupied = occupiedHexes.some(o => o.q === neighbor.q && o.r === neighbor.r);
        
        if (visited[key] === undefined || newCost < visited[key]) {
          visited[key] = newCost;
          // ユニットがいるマスは通過はできるが止まれない
          queue.push({ hex: neighbor, cost: newCost });
        }
      }
    }
  }

  // 他のユニットがいるマスを目的地から除外
  return reachable
    .filter(r => !occupiedHexes.some(o => o.q === r.hex.q && o.r === r.hex.r))
    .map(r => r.hex);
}
