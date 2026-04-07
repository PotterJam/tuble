import { describe, it, expect } from "vitest";
import { findRoute, getStationName, getAllStationIds } from "./pathfinding";

describe("findRoute", () => {
  it("returns empty segments for same station", () => {
    const ids = getAllStationIds();
    for (const id of ids) {
        const result = findRoute(id, id);
        expect(result.totalStops, `${id} -> ${id}`).toEqual(0);
      }
    }
  );

  it("throws for non-existent station", () => {
    expect(() => findRoute("fake-station", "bank")).toThrow("Unknown station: fake-station");
    expect(() => findRoute("bank", "fake-station")).toThrow("Unknown station: fake-station");
  });

  it("finds a direct single-line route between adjacent stations", () => {
    // Bank -> St. Paul's are adjacent on Central line
    const result = findRoute("bank", "st-pauls");
    expect(result.totalStops).toBe(1);
    expect(result.segments).toEqual([{ line: "central", stops: 1, endStationId: "st-pauls" }]);
  });

  it("finds a route requiring a line change", () => {
    // Victoria (Victoria line) to Canary Wharf (Jubilee line)
    const result = findRoute("victoria", "canary-wharf");
    expect(result).toEqual({
      segments: [
        { line: "victoria", stops: 2, endStationId: "oxford-circus" },
        { line: "central", stops: 1, endStationId: "tottenham-court-road" },
        { line: "elizabeth", stops: 4, endStationId: "canary-wharf" },
      ],
      totalStops: 7,
    });
  });

  it("finds a multi-stop route from Oxford Circus to Bank", () => {
    const result = findRoute("oxford-circus", "bank");
    expect(result).toEqual({
      segments: [
        { line: "central", stops: 5, endStationId: "bank" },
      ],
      totalStops: 5,
    });
  });


  it("every segment has a valid line", () => {
    const result = findRoute("paddington", "stratford");
    for (const seg of result.segments) {
      expect(seg.line).toBeTruthy();
      expect(seg.stops).toBeGreaterThan(0);
      expect(seg.endStationId).toBeTruthy();
    }
  });

  it("can find a route between every pair of stations", () => {
    const ids = getAllStationIds();
    for (const from of ids) {
      for (const to of ids) {
        if (from === to) continue;
        const result = findRoute(from, to);
        expect(result.totalStops, `${from} -> ${to}`).toBeGreaterThan(0);
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
