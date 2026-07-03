import { describe, expect, it } from "vitest";
import b1f from "../content/worlds/default/dungeons/b1f.md?raw";
import b2f from "../content/worlds/default/dungeons/b2f.md?raw";
import b3f from "../content/worlds/default/dungeons/b3f.md?raw";
import b4f from "../content/worlds/default/dungeons/b4f.md?raw";
import b5f from "../content/worlds/default/dungeons/b5f.md?raw";
import b6f from "../content/worlds/default/dungeons/b6f.md?raw";
import b7f from "../content/worlds/default/dungeons/b7f.md?raw";
import b8f from "../content/worlds/default/dungeons/b8f.md?raw";
import { ja } from "../src/i18n/ja";

const dungeonText = [b1f, b2f, b3f, b4f, b5f, b6f, b7f, b8f].join("\n");

describe("scenario prose gate", () => {
  it("blocks translated-English and abstract filler patterns in dungeon prose", () => {
    expect(dungeonText).not.toMatch(/待っている|物語|運命|伝説|真実|闇の秘密|静寂が支配する/);
    expect(dungeonText).not.toMatch(/\bwaits\b|\bdestiny\b|\blegend\b|\btruth\b/i);
  });

  it("keeps the Japanese town line concrete and sensory", () => {
    expect(ja.play.townCopy).toContain("石床");
    expect(ja.play.townCopy).toContain("匂い");
    expect(ja.play.townCopy).not.toMatch(/物語|運命|待っている|決意|勇気|胸が高鳴る/);
  });
});
