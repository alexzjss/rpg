export interface RollResult {
  total: number;
  dieRoll: number;
  bonus: number;
  notation: string;
  /** Resultado de cada dado individual */
  individualRolls: number[];
  numSides: number;
  numDice: number;
}

export const rollDice = (notation: string = "1d20", globalBonus: number = 0): RollResult => {
  const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!match) return { total: 0, dieRoll: 0, bonus: 0, notation: "invalid", individualRolls: [], numSides: 20, numDice: 1 };

  const numDice = parseInt(match[1]);
  const numSides = parseInt(match[2]);
  const notationBonus = match[3] ? parseInt(match[3]) : 0;

  const individualRolls: number[] = [];
  for (let i = 0; i < numDice; i++) {
    individualRolls.push(Math.floor(Math.random() * numSides) + 1);
  }

  const dieRoll = individualRolls.reduce((a, b) => a + b, 0);
  const totalBonus = notationBonus + globalBonus;

  return {
    dieRoll,
    bonus: totalBonus,
    total: dieRoll + totalBonus,
    notation: `${numDice}d${numSides}${totalBonus !== 0 ? (totalBonus >= 0 ? '+' : '') + totalBonus : ''}`,
    individualRolls,
    numSides,
    numDice,
  };
};