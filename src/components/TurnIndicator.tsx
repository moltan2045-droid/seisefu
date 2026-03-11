import { Turn, Season } from "../types";

interface TurnIndicatorProps {
  turn: Turn;
  year: number;
  season: Season;
  onEndTurn: () => void;
  isPlayerTurn: boolean;
}

export function TurnIndicator({ turn, year, season, onEndTurn, isPlayerTurn }: TurnIndicatorProps) {
  const factionNames: Record<Turn, string> = {
    South: "南朝",
    North: "北朝",
    Third: "直冬派",
    Independent: "独立勢力"
  };

  const seasonNames: Record<Season, string> = {
    Spring: "春",
    Summer: "夏",
    Autumn: "秋",
    Winter: "冬"
  };

  return (
    <div className="status-bar">
      <div className="time-display">
        <span className="year">{year}年</span>
        <span className={`season ${season}`}>{seasonNames[season]}</span>
      </div>
      <div className={`turn-indicator ${turn}`}>
        <span>勢力: <strong>{factionNames[turn]}</strong></span>
      </div>
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
