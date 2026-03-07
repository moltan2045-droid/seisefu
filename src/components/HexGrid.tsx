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
  onHexClick: (hex: Hex) => void;
}

export function HexGrid({ gameData, units, selectedUnitId, onHexClick }: HexGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Map
    for (let q = -5; q <= 10; q++) {
      for (let r = -5; r <= 10; r++) {
        if (Math.abs(q) + Math.abs(r) + Math.abs(-q - r) < 20) {
          let color = "#f9f9f9";
          const loc = gameData.key_locations.find(l => l.coords.q === q && l.coords.r === r);
          if (loc) color = "#eee";
          drawHex(ctx, q, r, color, "fill");
          
          if (loc) {
            const center = hexToPixel(q, r);
            ctx.fillStyle = "#999";
            ctx.font = "8px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(loc.name, center.x, center.y + 15);
          }
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
