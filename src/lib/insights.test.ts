import { describe, it, expect } from "vitest";
import {
  getAddedPerPhase,
  getDroppedPerPhase,
  getRekindledHobbies,
  getMostPersistent,
  getCoOccurrencePairs,
  computeInsights,
} from "./insights";
import type { Phase } from "./types";

const phases: Phase[] = [
  {
    id: "1",
    label: "Childhood",
    order: 0,
    hobbies: [
      { name: "drawing" },
      { name: "cycling" },
      { name: "reading" },
    ],
  },
  {
    id: "2",
    label: "Teen years",
    order: 1,
    hobbies: [
      { name: "cycling" },
      { name: "gaming" },
      { name: "reading" },
    ],
  },
  {
    id: "3",
    label: "College",
    order: 2,
    hobbies: [
      { name: "drawing" },
      { name: "hiking" },
      { name: "reading" },
    ],
  },
];

describe("getAddedPerPhase", () => {
  it("returns empty array for first phase", () => {
    expect(getAddedPerPhase(phases)[0]).toEqual([]);
  });
  it("returns new hobbies added in phase 2", () => {
    expect(getAddedPerPhase(phases)[1]).toContain("gaming");
    expect(getAddedPerPhase(phases)[1]).not.toContain("cycling");
  });
  it("returns added hobbies in phase 3", () => {
    expect(getAddedPerPhase(phases)[2]).toContain("hiking");
  });
});

describe("getDroppedPerPhase", () => {
  it("returns empty array for first phase", () => {
    expect(getDroppedPerPhase(phases)[0]).toEqual([]);
  });
  it("returns hobbies dropped from phase 1 to 2", () => {
    expect(getDroppedPerPhase(phases)[1]).toContain("drawing");
    expect(getDroppedPerPhase(phases)[1]).not.toContain("cycling");
  });
});

describe("getRekindledHobbies", () => {
  it("detects drawing as rekindled (present in 1, absent in 2, present in 3)", () => {
    expect(getRekindledHobbies(phases)).toContain("drawing");
  });
  it("does not mark reading as rekindled (present in all phases)", () => {
    expect(getRekindledHobbies(phases)).not.toContain("reading");
  });
  it("does not mark gaming as rekindled (only appears once)", () => {
    expect(getRekindledHobbies(phases)).not.toContain("gaming");
  });
});

describe("getMostPersistent", () => {
  it("reading appears in all 3 phases and ranks first", () => {
    const result = getMostPersistent(phases);
    expect(result[0]!.hobby).toBe("reading");
    expect(result[0]!.count).toBe(3);
  });
  it("cycling appears in 2 phases", () => {
    const result = getMostPersistent(phases);
    const cycling = result.find((r) => r.hobby === "cycling");
    expect(cycling?.count).toBe(2);
  });
});

describe("getCoOccurrencePairs", () => {
  it("returns pairs within same phase", () => {
    const pairs = getCoOccurrencePairs(phases);
    const pairNames = pairs.map((p) => [...p.pair].sort().join(","));
    expect(pairNames).toContain("cycling,reading");
  });
  it("returns sorted by count descending", () => {
    const pairs = getCoOccurrencePairs(phases);
    for (let i = 1; i < pairs.length; i++) {
      expect(pairs[i - 1]!.count).toBeGreaterThanOrEqual(pairs[i]!.count);
    }
  });
  it("returns at most 20 pairs", () => {
    expect(getCoOccurrencePairs(phases).length).toBeLessThanOrEqual(20);
  });
});

describe("computeInsights", () => {
  it("returns all insight keys", () => {
    const result = computeInsights(phases);
    expect(result).toHaveProperty("rekindled");
    expect(result).toHaveProperty("mostPersistent");
    expect(result).toHaveProperty("addedPerPhase");
    expect(result).toHaveProperty("droppedPerPhase");
    expect(result).toHaveProperty("coOccurrencePairs");
  });
  it("handles empty phases array", () => {
    const result = computeInsights([]);
    expect(result.rekindled).toEqual([]);
    expect(result.mostPersistent).toEqual([]);
  });
});
