import worldMarkdown from "../../content/worlds/default/world.md?raw";
import b1fMarkdown from "../../content/worlds/default/dungeons/b1f.md?raw";
import b2fMarkdown from "../../content/worlds/default/dungeons/b2f.md?raw";
import b3fMarkdown from "../../content/worlds/default/dungeons/b3f.md?raw";
import b4fMarkdown from "../../content/worlds/default/dungeons/b4f.md?raw";
import b5fMarkdown from "../../content/worlds/default/dungeons/b5f.md?raw";
import b6fMarkdown from "../../content/worlds/default/dungeons/b6f.md?raw";
import b7fMarkdown from "../../content/worlds/default/dungeons/b7f.md?raw";
import b8fMarkdown from "../../content/worlds/default/dungeons/b8f.md?raw";
import itemsMarkdown from "../../content/worlds/default/items.md?raw";
import enemiesMarkdown from "../../content/worlds/default/enemies.md?raw";
import encountersMarkdown from "../../content/worlds/default/encounters.md?raw";
import treasureMarkdown from "../../content/worlds/default/treasure.md?raw";
import progressionMarkdown from "../../content/worlds/default/progression.md?raw";
import {
  parseScenarioEncounters,
  parseScenarioEnemies,
  parseScenarioItems,
  parseScenarioProgression,
  parseScenarioTreasure,
  parseScenarioWorld
} from "../domain/scenario";

const items = parseScenarioItems(itemsMarkdown);
const enemies = parseScenarioEnemies(enemiesMarkdown);
const encounters = parseScenarioEncounters(encountersMarkdown);
const treasure = parseScenarioTreasure(treasureMarkdown);
const progression = parseScenarioProgression(progressionMarkdown);

export const defaultWorld = parseScenarioWorld(
  worldMarkdown,
  [b1fMarkdown, b2fMarkdown, b3fMarkdown, b4fMarkdown, b5fMarkdown, b6fMarkdown, b7fMarkdown, b8fMarkdown],
  {
    items: items.items,
    equipment: items.equipment,
    shops: items.shops,
    enemies: enemies.enemies,
    encounterTables: encounters.encounterTables,
    treasureTables: treasure.treasureTables,
    progressionFlags: progression.progressionFlags
  }
);
