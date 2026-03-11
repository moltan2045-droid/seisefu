import { Unit } from "../types";

interface UnitInfoProps {
  unit: Unit | null;
}

export function UnitInfo({ unit }: UnitInfoProps) {
  if (!unit) return null;

  const totalPower = unit.figure.vassals?.reduce((sum, v) => sum + v.power, 0) || 0;

  return (
    <div className="unit-detail">
      <h3>{unit.figure.name} ({unit.figure.faction})</h3>
      <p>HP: {unit.hp}/{unit.maxHp} | ATK: {unit.attack} | DEF: {unit.defense}</p>
      <p><strong>特殊能力:</strong> <i>{unit.figure.special_skill}</i></p>
      <p>{unit.figure.stats_hint}</p>

      {unit.figure.vassals && unit.figure.vassals.length > 0 && (
        <div className="vassals-info">
          <h4>配下武将・協力勢力 (推定総戦力: {totalPower}騎)</h4>
          <ul>
            {unit.figure.vassals.map((v, i) => (
              <li key={i}>
                <strong>{v.name}</strong> ({v.role}): {v.power}騎
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
