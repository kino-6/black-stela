import worldMarkdown from "../../content/worlds/default/world.md?raw";
import b1fMarkdown from "../../content/worlds/default/dungeons/b1f.md?raw";
import { parseScenarioWorld } from "../domain/scenario";

export const defaultWorld = parseScenarioWorld(worldMarkdown, [b1fMarkdown]);
