interface GameLogProps {
  log: string;
}

export function GameLog({ log }: GameLogProps) {
  return (
    <div className="game-log">
      <p><strong>戦況ログ:</strong></p>
      <p>{log}</p>
    </div>
  );
}
