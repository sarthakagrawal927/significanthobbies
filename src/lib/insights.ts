import type { Phase } from "./types";

export function getAddedPerPhase(phases: Phase[]): string[][] {
  return phases.map((phase, i) => {
    if (i === 0) return [];
    const prev = new Set(
      phases[i - 1]!.hobbies.map((h) => h.name.toLowerCase()),
    );
    return phase.hobbies
      .map((h) => h.name.toLowerCase())
      .filter((name) => !prev.has(name));
  });
}

export function getDroppedPerPhase(phases: Phase[]): string[][] {
  return phases.map((phase, i) => {
    if (i === 0) return [];
    const curr = new Set(phase.hobbies.map((h) => h.name.toLowerCase()));
    return phases[i - 1]!.hobbies
      .map((h) => h.name.toLowerCase())
      .filter((name) => !curr.has(name));
  });
}

export function getRekindledHobbies(phases: Phase[]): string[] {
  const allHobbies = new Set(
    phases.flatMap((p) => p.hobbies.map((h) => h.name.toLowerCase())),
  );
  const rekindled: string[] = [];

  for (const hobby of allHobbies) {
    let wasPresent = false;
    let wasAbsent = false;
    for (const phase of phases) {
      const present = phase.hobbies.some(
        (h) => h.name.toLowerCase() === hobby,
      );
      if (present && !wasPresent && !wasAbsent) {
        wasPresent = true;
      } else if (!present && wasPresent) {
        wasAbsent = true;
      } else if (present && wasAbsent) {
        rekindled.push(hobby);
        break;
      }
    }
  }
  return rekindled;
}

export function getMostPersistent(
  phases: Phase[],
): { hobby: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const phase of phases) {
    for (const h of phase.hobbies) {
      const name = h.name.toLowerCase();
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([hobby, count]) => ({ hobby, count }))
    .sort((a, b) => b.count - a.count);
}

export function getCoOccurrencePairs(
  phases: Phase[],
): { pair: string[]; count: number }[] {
  const pairCounts = new Map<string, number>();
  for (const phase of phases) {
    const names = phase.hobbies
      .map((h) => h.name.toLowerCase())
      .sort();
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const key = `${names[i]}|||${names[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }
  return Array.from(pairCounts.entries())
    .map(([key, count]) => ({ pair: key.split("|||"), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

export type Insights = {
  addedPerPhase: string[][];
  droppedPerPhase: string[][];
  rekindled: string[];
  mostPersistent: { hobby: string; count: number }[];
  coOccurrencePairs: { pair: string[]; count: number }[];
};

export function computeInsights(phases: Phase[]): Insights {
  return {
    addedPerPhase: getAddedPerPhase(phases),
    droppedPerPhase: getDroppedPerPhase(phases),
    rekindled: getRekindledHobbies(phases),
    mostPersistent: getMostPersistent(phases),
    coOccurrencePairs: getCoOccurrencePairs(phases),
  };
}
