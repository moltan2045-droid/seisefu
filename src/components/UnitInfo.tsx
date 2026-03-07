import { Unit } from "../types";

interface UnitInfoProps {
  unit: Unit | null;
}

export function UnitInfo({ unit }: UnitInfoProps) {
  if (!unit) return null;

  return (
    <div className="unit-detail">
      <h3>{unit.figure.name} ({unit.figure.faction})</h3>
      <p>HP: {unit.hp}/{unit.maxHp} | ATK: {unit.attack} | DEF: {unit.defense}</p>
      <p><i>{unit.figure.special_skill}</i></p>
      <p>{unit.figure.stats_hint}</p>
    </div>
  );
}
