export interface Point { x: number; y: number; }

/** Ângulo em graus, 0° = topo, sentido horário. Retorna ponto cartesiano. */
export function polar(angleDeg: number, radius: number): Point {
  const rad = (angleDeg - 90) * (Math.PI / 180); // -90 para 0°=topo
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

/** Distribui `count` itens simetricamente num arco de `arcDeg` centrado no topo (0°). */
export function satelliteAngles(count: number, arcDeg: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];
  const step = arcDeg / (count - 1);
  const start = -arcDeg / 2;
  return Array.from({ length: count }, (_, i) => start + i * step);
}
