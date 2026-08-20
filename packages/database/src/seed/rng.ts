export function createRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(
  rng: () => number,
  minInclusive: number,
  maxInclusive: number,
): number {
  return minInclusive + Math.floor(rng() * (maxInclusive - minInclusive + 1));
}

export function rupeesToPaise(rupees: number): number {
  return rupees * 100;
}
