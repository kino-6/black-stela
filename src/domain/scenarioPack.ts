import { z } from "zod";
import { parseMarkdownFrontMatter } from "./scenario";

export const scenarioPackManifestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  version: z.string().min(1),
  supportedLanguages: z.array(z.enum(["en", "ja"])).min(1),
  entryWorld: z.string().min(1),
  dungeons: z.array(z.string().min(1)).min(1),
  compatibility: z.object({
    minAppVersion: z.string().min(1)
  })
});

export type ScenarioPackManifest = z.infer<typeof scenarioPackManifestSchema>;

export interface ScenarioValidationError {
  filePath: string;
  fieldPath: string;
  reason: string;
}

export function parseScenarioPackManifest(markdown: string): ScenarioPackManifest {
  return parseMarkdownFrontMatter(markdown, scenarioPackManifestSchema).data;
}
