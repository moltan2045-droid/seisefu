import { Hex, Pixel } from "../types";

export const HEX_SIZE = 30;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export function hexToPixel(q: number, r: number): Pixel {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r) + CANVAS_WIDTH / 2 - 200;
  const y = HEX_SIZE * ((3 / 2) * r) + CANVAS_HEIGHT / 2 - 150;
  return { x, y };
}

export function pixelToHex(x: number, y: number): Hex {
  const adjustedX = x - (CANVAS_WIDTH / 2 - 200);
  const adjustedY = y - (CANVAS_HEIGHT / 2 - 150);
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
