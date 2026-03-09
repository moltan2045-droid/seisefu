import { useRef, useEffect } from "react";
import { GameData, Unit, Hex } from "../types";
import { 
  HEX_SIZE, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  hexToPixel, 
  pixelToHex 
} from "../utils/hexUtils";

interface HexGridProps {
  gameData: GameData | null;
  units: Unit[];
  selectedUnitId: number | null;
  reachableHexes: Hex[];
  onHexClick: (hex: Hex) => void;
}

export function HexGrid({ gameData, units, selectedUnitId, reachableHexes, onHexClick }: HexGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Map
    for (let q = -2; q <= 8; q++) {
      for (let r = -2; r <= 8; r++) {
        // Draw tiles within a sensible range for Kyushu
        const tile = (gameData.map_tiles || []).find(t => t.q === q && t.r === r);
        
        // --- 九州の地形生成ロジック ---
        // データにタイル情報がない場合、座標から九州の形状を近似する
        let terrainType = "sea";
        if (tile) {
          terrainType = tile.type;
        } else {
          // r座標(北から南)ごとに陸地(q)の範囲を指定して九州を形作る
          const landRanges: Record<number, [number, number]> = {
            [-2]: [4, 5], // 豊前・国東
            [-1]: [3, 5], // 筑前・豊前
            [0]:  [3, 5], // 筑前
            [1]:  [1, 6], // 松浦〜豊後
            [2]:  [1, 5], // 長崎〜肥後〜筑紫
            [3]:  [1, 4], // 天草〜肥後
            [4]:  [1, 3], // 肥後南部・日向
            [5]:  [0, 2], // 薩摩・大隅
            [6]:  [0, 1]  // 坊津・大隅半島
          };

          const range = landRanges[r];
          if (range && q >= range[0] && q <= range[1]) {
            terrainType = "plain";
          } else {
            terrainType = "sea";
          }
        }
        
        const terrain = (gameData.terrain_types || {})[terrainType];
        let color = terrain?.color || (terrainType === "sea" ? "#81d4fa" : "#aed581");

        const loc = (gameData.key_locations || []).find(l => l.coords.q === q && l.coords.r === r);
        if (loc) color = "#ffeb3b"; // Cities/Forts in yellow
        
        drawHex(ctx, q, r, color, "fill");
        ctx.strokeStyle = "rgba(0,0,0,0.05)";
        drawHex(ctx, q, r, "", "stroke");

        // Draw Reachable Highlight
        const isReachable = reachableHexes.some(h => h.q === q && h.r === r);
        if (isReachable) {
          ctx.globalAlpha = 0.4;
          drawHex(ctx, q, r, "#00bcd4", "fill");
          ctx.globalAlpha = 1.0;
        }
        
        if (loc) {
          const center = hexToPixel(q, r);
          ctx.fillStyle = "#333";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(loc.name, center.x, center.y + 18);
        }
      }
    }

    // Draw Units
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
      
      // HP Bar
      const barWidth = 20;
      const hpPercent = unit.hp / unit.maxHp;
      ctx.fillStyle = "red"; 
      ctx.fillRect(center.x - barWidth / 2, center.y + 5, barWidth, 4);
      ctx.fillStyle = "green"; 
      ctx.fillRect(center.x - barWidth / 2, center.y + 5, barWidth * hpPercent, 4);
      ctx.strokeRect(center.x - barWidth / 2, center.y + 5, barWidth, 4);
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
    if (mode === "fill") {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hex = pixelToHex(x, y);
    onHexClick(hex);
  };

  return (
    <canvas 
      ref={canvasRef} 
      width={CANVAS_WIDTH} 
      height={CANVAS_HEIGHT} 
      onClick={handleClick} 
    />
  );
}
