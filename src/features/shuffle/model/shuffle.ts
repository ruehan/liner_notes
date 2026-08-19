export function pickShuffleIndex(
  candidates: readonly number[],
  random: () => number = Math.random,
): number | null {
  if (candidates.length === 0) return null;
  const i = Math.min(
    candidates.length - 1,
    Math.floor(random() * candidates.length),
  );
  return candidates[i];
}
