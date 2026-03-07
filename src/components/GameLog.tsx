interface GameLogProps {
  log: string;
}

export function GameLog({ log }: GameLogProps) {
  return (
    <div className="info-panel">
      <p><strong>戦況ログ:</strong> {log}</p>
    </div>
  );
}
