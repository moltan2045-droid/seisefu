import { Turn } from "../types";

interface TurnIndicatorProps {
  turn: Turn;
  onEndTurn: () => void;
  isPlayerTurn: boolean;
}

export function TurnIndicator({ turn, onEndTurn, isPlayerTurn }: TurnIndicatorProps) {
  const names: Record<Turn, string> = {
    South: "南朝",
    North: "北朝",
    Third: "直冬派",
    Independent: "独立勢力"
  };

  return (
    <div className="status-bar">
      <span className={`turn-indicator ${turn}`}>
        現在: <strong>{names[turn]} ({turn})</strong> ターン
      </span>
      <button 
        onClick={onEndTurn} 
        className="end-turn-btn" 
        disabled={!isPlayerTurn}
      >
        ターン終了
      </button>
    </div>
  );
}
