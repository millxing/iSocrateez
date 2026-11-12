import { describe, expect, it } from "vitest";
import type { AnswerRecord } from "../shared/contracts";
import { scoreProfile } from "../shared/ethics";
import { buildCalibrationFile, parseCalibrationFile } from "./calibrationFile";

const answers: AnswerRecord[] = ["op-1", "op-2", "op-3", "ic-1", "ic-2", "ic-3", "ri-1", "ri-2", "ri-3"].map(
  (questionId, index) => ({ questionId, value: index % 2 === 0 ? 2 : -1 })
);

describe("calibration file", () => {
  it("restores the answers it saved", () => {
    expect(parseCalibrationFile(buildCalibrationFile(answers))).toEqual({ answers });
  });

  it("falls back to the saved coordinates when the answers no longer match the question bank", () => {
    const file = JSON.parse(buildCalibrationFile(answers));
    file.answers[0].questionId = "retired-question";

    expect(parseCalibrationFile(JSON.stringify(file))).toEqual({ profile: scoreProfile(answers) });
  });

  it("rejects files that are not a calibration", () => {
    expect(parseCalibrationFile("not json")).toBeNull();
    expect(parseCalibrationFile("null")).toBeNull();
    expect(parseCalibrationFile(JSON.stringify({ answers }))).toBeNull();
    expect(
      parseCalibrationFile(
        JSON.stringify({ app: "isocrateez", kind: "calibration", answers: [], profile: { outcomesPrinciples: 4 } })
      )
    ).toBeNull();
  });
});
