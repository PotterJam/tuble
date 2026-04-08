import { describe, it, expect } from "vitest";
import { findRoute, getStationName, getAllStationIds } from "./pathfinding";

describe("findRoute", () => {
  it("returns empty segments for same station", () => {
    const ids = getAllStationIds();
    for (const id of ids) {
        const result = findRoute(id, id);
        expect(result, `${id} -> ${id}`).toEqual([{ segments: [], totalStops: 0 }]);
      }
    }
  );

  it("throws for non-existent station", () => {
    expect(() => findRoute("fake-station", "bank")).toThrow("Unknown station: fake-station");
    expect(() => findRoute("bank", "fake-station")).toThrow("Unknown station: fake-station");
  });

  it("finds a direct single-line route between adjacent stations", () => {
    const result = findRoute("bank", "st-pauls");
    expect(result).toHaveLength(1);
    expect(result[0].totalStops).toBe(1);
    expect(result[0].segments[0]).toMatchObject({ lines: ["central"], stops: 1, endStationId: "st-pauls" });
    expect(result[0].segments[0].path).toEqual(["st-pauls"]);
  });

  it("finds a route with multiple options and merges parallel lines", () => {
    const result = findRoute("victoria", "canary-wharf");
    expect(result).toHaveLength(2);
    expect(result[0].totalStops).toBe(8);
    expect(result[0].segments[0]).toMatchObject({ lines: ["circle", "district"], stops: 2, endStationId: "westminster" });
    expect(result[0].segments[1]).toMatchObject({ lines: ["jubilee"], stops: 6, endStationId: "canary-wharf" });
    expect(result[1].segments[0]).toMatchObject({ lines: ["victoria"], stops: 1, endStationId: "green-park" });
    expect(result[1].segments[1]).toMatchObject({ lines: ["jubilee"], stops: 7, endStationId: "canary-wharf" });
  });

  it("finds a single line route from Oxford Circus to Bank", () => {
    const result = findRoute("oxford-circus", "bank");
    const match = result.find(r =>
      r.segments.length === 1 &&
      r.segments[0].lines.includes("central") &&
      r.segments[0].stops === 5 &&
      r.segments[0].endStationId === "bank"
    );
    expect(match).toBeTruthy();
  });

  it("every segment has valid lines", () => {
    const result = findRoute("paddington", "stratford");
    for (const route of result) {
      for (const seg of route.segments) {
        expect(seg.lines.length).toBeGreaterThan(0);
        expect(seg.stops).toBeGreaterThan(0);
        expect(seg.endStationId).toBeTruthy();
      }
    }
  });

  it("can find a route between every pair of stations", () => {
    const ids = getAllStationIds();
    for (const from of ids) {
      for (const to of ids) {
        if (from === to) continue;
        const result = findRoute(from, to);
        expect(result.length, `${from} -> ${to}`).toBeGreaterThan(0);
        expect(result[0].totalStops, `${from} -> ${to}`).toBeGreaterThan(0);
      }
    }
  }, 30_000);
});

describe("getStationName", () => {
  it("returns station name for valid id", () => {
    expect(getStationName("bank")).toBe("Bank");
  });

  it("returns undefined for invalid id", () => {
    expect(getStationName("nonexistent")).toBeUndefined();
  });
});

describe("getAllStationIds", () => {
  it("returns all 299 stations", () => {
    expect(getAllStationIds().length).toBe(299);
  });
});
