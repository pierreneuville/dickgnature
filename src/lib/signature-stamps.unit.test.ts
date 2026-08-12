import { describe, expect, it } from "vitest";
import {
  SIGNATURE_STAMPS,
  findStamp,
  stampsForTone,
  stampToPointGroups,
} from "@/lib/signature-stamps";

describe("signature-stamps", () => {
  it("ships six distinct motifs with unique ids", () => {
    expect(SIGNATURE_STAMPS).toHaveLength(6);
    const ids = SIGNATURE_STAMPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every point within the normalised 0..1 range", () => {
    for (const stamp of SIGNATURE_STAMPS) {
      expect(stamp.strokes.length).toBeGreaterThan(0);
      for (const stroke of stamp.strokes) {
        expect(stroke.length).toBeGreaterThan(0);
        for (const [x, y] of stroke) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(1);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("exposes the full gallery in fun tone", () => {
    expect(stampsForTone("fun")).toEqual(SIGNATURE_STAMPS);
  });

  it("exposes nothing in serious tone — no humour imposed on the signer", () => {
    expect(stampsForTone("serious")).toHaveLength(0);
  });

  it("finds a stamp by id and returns undefined for unknown ids", () => {
    expect(findStamp("classic")?.id).toBe("classic");
    expect(findStamp("nope")).toBeUndefined();
  });

  it("scales normalised strokes to the canvas dimensions for signature_pad", () => {
    const stamp = SIGNATURE_STAMPS[0];
    const width = 400;
    const height = 200;
    const groups = stampToPointGroups(stamp, width, height);

    expect(groups).toHaveLength(stamp.strokes.length);
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      expect(group.compositeOperation).toBe("source-over");
      expect(group.points).toHaveLength(stamp.strokes[i].length);
      for (let j = 0; j < group.points.length; j++) {
        const [nx, ny] = stamp.strokes[i][j];
        expect(group.points[j].x).toBeCloseTo(nx * width);
        expect(group.points[j].y).toBeCloseTo(ny * height);
      }
    }
  });
});
