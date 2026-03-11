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
  hoveredHex: Hex | null;
  onHexClick: (hex: Hex) => void;
  onHexHover: (hex: Hex | null) => void;
}

export function HexGrid({ gameData, units, selectedUnitId, reachableHexes, hoveredHex, onHexClick, onHexHover }: HexGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Map
    for (let q = -5; q <= 12; q++) {
      for (let r = -5; r <= 12; r++) {
        const tile = (gameData.map_tiles || []).find(t => t.q === q && t.r === r);
        
        let terrainType = "sea";
        if (tile) {
          terrainType = tile.type;
        } else {
          // --- 予備ロジック：九州の正確な形状定義 ---
          const landRanges: Record<number, [number, number]> = {
            [-2]: [2, 4],   // 対馬・赤間関（分離のためqを限定）
            [-1]: [99, 99], // 関門海峡（意図的に空に）
            [0]:  [2, 5],   // 筑前・豊前
            [1]:  [1, 6],   // 肥前・筑後・豊後
            [2]:  [1, 7],   // 肥前・肥後・豊後
            [3]:  [1, 8],   // 肥後・日向
            [4]:  [1, 7],   // 肥後南部・日向
            [5]:  [1, 6],   // 薩摩・大隅
            [6]:  [1, 5]    // 薩摩南部
          };

          const range = landRanges[r];
          if (range && q >= range[0] && q <= range[1]) {
            terrainType = "plain";
          }
        }
        
        const terrain = (gameData.terrain_types || {})[terrainType];
        let color = terrain?.color || (terrainType === "sea" ? "#81d4fa" : "#aed581");

        const loc = (gameData.key_locations || []).find(l => l.coords.q === q && l.coords.r === r);
        if (loc) color = "#ffeb3b";
        
        drawHex(ctx, q, r, color, "fill");
        ctx.strokeStyle = "rgba(0,0,0,0.05)";
        drawHex(ctx, q, r, "", "stroke");

        // Highlight Hovered Hex
        if (hoveredHex && hoveredHex.q === q && hoveredHex.r === r) {
          ctx.globalAlpha = 0.3;
          drawHex(ctx, q, r, "white", "fill");
          ctx.globalAlpha = 1.0;
          ctx.lineWidth = 2;
          ctx.strokeStyle = "white";
          drawHex(ctx, q, r, "", "stroke");
        }

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
    // ... (rest of the draw logic remains the same)
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
  }, [units, selectedUnitId, gameData, reachableHexes, hoveredHex]);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hex = pixelToHex(x, y);
    onHexHover(hex);
  };

  const handleMouseLeave = () => {
    onHexHover(null);
  };

  return (
    <canvas 
      ref={canvasRef} 
      width={CANVAS_WIDTH} 
      height={CANVAS_HEIGHT} 
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}
