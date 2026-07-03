import { describe, expect, it } from "vitest";
import uxGate from "../docs/gates/drpg-ux-gate.md?raw";
import uxSkill from "../docs/skills/drpg-ux-review-skill.md?raw";
import humanGate from "../docs/gates/human-requirement-gate.md?raw";
import pastTroubleGate from "../docs/gates/past-trouble-regression-gate.md?raw";
import gateReviewSkill from "../docs/skills/black-stela-gate-review-skill.md?raw";

describe("DRPG UX gate documentation", () => {
  it("requires six-member row-visible party review", () => {
    expect(uxSkill).toContain("Normal party capacity is six");
    expect(uxSkill).toContain("front row and back row");
    expect(uxGate).toContain("Six-member party assumptions");
    expect(uxGate).toContain("Front row and back row");
  });

  it("is linked from the human requirement gate", () => {
    expect(humanGate).toContain("DRPG UX Gate");
    expect(humanGate).toContain("Codex reviewed the actual browser UI");
  });

  it("keeps past trouble regression checks in the gate review path", () => {
    expect(gateReviewSkill).toContain("past-trouble-regression-gate.md");
    expect(gateReviewSkill).toContain("headless is never UX proof");
    expect(uxSkill).toContain("black-stela-gate-review-skill.md");
    expect(humanGate).toContain("past-trouble-regression-gate.md");
    expect(pastTroubleGate).toContain("Character creation");
    expect(pastTroubleGate).toContain("Dungeon topology");
    expect(pastTroubleGate).toContain("Assets");
    expect(pastTroubleGate).toContain("Claiming done");
  });
});
