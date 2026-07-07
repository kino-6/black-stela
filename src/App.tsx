import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  DoorOpen,
  Footprints,
  FolderOpen,
  LogOut,
  Repeat2,
  Save,
  Volume2,
  Search,
  ShieldCheck,
  Square,
  Sword,
  Upload,
  Wand2
} from "lucide-react";
import { DungeonView } from "./components/DungeonView";
import { MapPanel } from "./components/MapPanel";
import { ScenarioValidationPanel } from "./components/ScenarioValidationPanel";
import { createInitialGameState, addCharacter } from "./domain/gameState";
import {
  backgroundCatalog,
  classCatalog,
  createGuildCharacter,
  findBackground,
  findClass,
  findTrait,
  PARTY_SIZE_LIMIT,
  traitCatalog
} from "./domain/characterCreation";
import { getGridEdge, getLocalizedRoomText, getRoom, isBossFloor } from "./domain/scenario";
import { createIdentitySuggestion } from "./domain/identitySuggestion";
import { executeCommand, listUnlockedCheckpoints } from "./domain/rulesEngine";
import { getTempoModeForPhase, runTempoStep, type TempoMode } from "./domain/tempo";
import { SPELLS, knownSpells, type SpellId } from "./domain/spells";
import {
  activateControllerCancel,
  focusFirstControllerChoice,
  isControllerInteractiveTarget,
  isTypingTarget,
  moveControllerFocus
} from "./ui/controllerFocus";
import {
  formatBonusParts,
  formatCombatRow,
  formatDebugProgress,
  formatEquipmentEffect,
  formatEquipmentSlot,
  formatInventoryEffect,
  formatPhase,
  formatSignedBonus,
  formatSignedDelta,
  formatStatDelta,
  getMemberRecoveryCost,
  isRecoveryEventType,
  isShopEventType
} from "./ui/format";
import {
  SHOP_CATEGORY_ORDER,
  equippedName,
  findEquipmentById,
  localizedCatalogDescription,
  localizedCatalogName,
  localizedEnemyGroupName,
  previewEquipmentStats,
  shopCategoryFor,
  type ShopCategory
} from "./ui/catalog";
import { projectEventToLog } from "./domain/replayLog";
import { calculateRecoveryCost, getEffectiveCharacterStats, isEquipmentUsableBy } from "./domain/economy";
import type {
  CharacterAptitudes,
  CharacterBackgroundId,
  Character,
  CharacterClassId,
  CharacterTraitId,
  CombatActionDeclaration,
  CombatActionKind,
  CombatEnemyGroup,
  Command,
  EquipmentSlot,
  GameState,
  InventoryItem,
  ScenarioEquipment
} from "./domain/types";
import {
  createDebugStateFromProgress,
  debugProgressValues,
  parseDebugProgress,
  type DebugProgress
} from "./debug/debugStart";
import { runHeadlessClear } from "./headless/headlessRunner";
import { defaultWorld } from "./data/defaultWorld";
import { fromSaveDataV1, toSaveDataV1 } from "./domain/saveData";
import { LocalStorageSaveRepository, type SaveSlotSummary } from "./services/saveRepository";
import { createTranslator, type Locale, type Translator } from "./i18n";
import { loadLocale, saveLocale as persistLocale } from "./services/settingsRepository";
import type { ScenarioValidationError } from "./domain/scenarioPack";
import { loadScenarioPack, type ScenarioPackFiles } from "./services/scenarioPackLoader";
import { formatScenarioSummary, summarizeScenario } from "./services/scenarioSummary";

interface CharacterDraft {
  name: string;
  notes: string;
  title: string;
  classId: CharacterClassId;
  backgroundId: CharacterBackgroundId;
  traitId: CharacterTraitId;
  aptitudeFocus: "balanced" | "might" | "agility" | "spirit" | "wit" | "luck";
  bonusPool: number;
  bonusAptitude: CharacterAptitudes;
  bonusSeed: number;
  originSeed: number;
  identitySeed: number;
  accentColor: string;
  portraitRef?: string;
}

type GuildCreationStep = "briefing" | "class" | "appearance" | "bonus" | "name";
type GuildOfferState = "ask" | "suggestion" | "dismissed";
type TownMode = "guild" | "shop" | "recovery" | "records" | "entry";
type AppScreen = "title" | "config" | "game";

const SPELL_LABEL_KEY: Record<SpellId, "play.spellHeal" | "play.spellFirebolt" | "play.spellSleep"> = {
  heal: "play.spellHeal",
  firebolt: "play.spellFirebolt",
  sleep: "play.spellSleep"
};

const AUTO_SAVE_SLOT = "autosave";
const defaultDraft: CharacterDraft = {
  name: "",
  notes: "",
  title: "",
  classId: "vanguard",
  backgroundId: "watch",
  traitId: "steady",
  aptitudeFocus: "balanced",
  bonusPool: 5,
  bonusAptitude: { might: 0, agility: 0, spirit: 0, wit: 0, luck: 0 },
  bonusSeed: 1,
  originSeed: 1,
  identitySeed: 1,
  accentColor: "#c9a765"
};

const aptitudeKeys: (keyof CharacterAptitudes)[] = ["might", "agility", "spirit", "wit", "luck"];
const guildStepOrder: GuildCreationStep[] = ["briefing", "class", "appearance", "bonus", "name"];
const equipmentSlotOrder: EquipmentSlot[] = ["weapon", "offhand", "body", "head", "hands", "accessory"];

export function App() {
  const [debugMode] = useState(() => isDebugModeEnabled());
  const [debugProgress, setDebugProgress] = useState<DebugProgress>(() => getDebugProgressFromLocation());
  const scenarioValidationErrors = useMemo(() => getScenarioValidationErrorsFromLocation(), []);
  const [state, setState] = useState<GameState>(() =>
    debugMode ? createDebugStateFromProgress(defaultWorld, getDebugProgressFromLocation()) : createInitialGameState()
  );
  const stateRef = useRef(state);
  const [screen, setScreen] = useState<AppScreen>(() =>
    debugMode || scenarioValidationErrors.length > 0 ? "game" : "title"
  );
  const [draft, setDraft] = useState<CharacterDraft>(() => createFreshDraft({ bonusSeed: 1 }));
  const [townMode, setTownMode] = useState<TownMode>("guild");
  const [headlessStatus, setHeadlessStatus] = useState("");
  const saveRepository = useMemo(() => createBrowserSaveRepository(), []);
  const [locale, setLocale] = useState<Locale>(() => loadLocale());
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [saveSlotId, setSaveSlotId] = useState(AUTO_SAVE_SLOT);
  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>(() => createBrowserSaveRepository()?.list() ?? []);
  const [saveStatus, setSaveStatus] = useState("");
  const [tempoStatus, setTempoStatus] = useState("");
  const [tempoMode, setTempoMode] = useState<TempoMode>("idle");
  const [guildCreationStep, setGuildCreationStep] = useState<GuildCreationStep>("briefing");
  const [guildOfferState, setGuildOfferState] = useState<GuildOfferState>("ask");
  const [combatOrders, setCombatOrders] = useState<CombatActionDeclaration[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [shopCategory, setShopCategory] = useState<ShopCategory>("weapon");
  const [scenarioImportStatus, setScenarioImportStatus] = useState("");
  const [scenarioImportErrors, setScenarioImportErrors] = useState<ScenarioValidationError[]>([]);
  const autosaveSummary = saveSlots.find((slot) => slot.slotId === AUTO_SAVE_SLOT);
  const hasAutosave = autosaveSummary?.status === "valid";
  const hasCorruptAutosave = autosaveSummary?.status === "corrupt";

  const roomText = useMemo(() => {
    if (!state.position) {
      return null;
    }

    return getLocalizedRoomText(defaultWorld, state.position.roomId, locale);
  }, [locale, state.position]);
  const currentRoom = useMemo(() => (state.position ? getRoom(defaultWorld, state.position.roomId) : null), [state.position]);
  const canReturnToTown = Boolean(currentRoom?.stairsToTown || currentRoom?.restPoint);
  const escapeItem = state.inventory.find((item) => item.kind === "escape" && item.quantity > 0);
  const canUseEscapeItem =
    Boolean(escapeItem) && state.phase === "dungeon" && !isBossFloor(defaultWorld, state.map.floorId);
  const canUseStairs = Boolean(
    state.position && getGridEdge(defaultWorld, state.position.roomId, state.position.facing)?.kind === "stairs"
  );

  const latestLogText = useMemo(() => {
    const entry = state.log.at(-1);
    if (!entry) {
      return "";
    }

    if (state.phase === "combat" && entry.event?.type === "enemy_encountered") {
      return "";
    }

    return entry.event ? projectEventToLog(entry.event, locale, defaultWorld)?.text ?? entry.text : entry.text;
  }, [locale, state.log, state.phase]);
  const latestEventType = state.log.at(-1)?.event?.type;

  const livingEnemyGroups = useMemo(
    () => state.combat?.enemyGroups.filter((group) => group.count > 0) ?? [],
    [state.combat?.enemyGroups]
  );
  const activeParty = useMemo(
    () => state.party.filter((member) => member.hp > 0 && !member.injury),
    [state.party]
  );
  const selectedTarget = livingEnemyGroups.find((group) => group.id === selectedTargetId) ?? livingEnemyGroups[0] ?? null;
  const orderedActorIds = useMemo(() => new Set(combatOrders.map((order) => order.actorId)), [combatOrders]);
  const selectedActor = activeParty.find((member) => !orderedActorIds.has(member.id)) ?? null;
  const frontRowStanding = activeParty.some((member) => member.row === "front");
  const canSelectedActorAttack = Boolean(
    selectedActor && selectedTarget && !(selectedActor.row === "back" && frontRowStanding)
  );
  const canCycleCombatTarget = livingEnemyGroups.length > 1;
  const combatOrdersReady = state.phase === "combat" && activeParty.length > 0 && activeParty.every((member) => orderedActorIds.has(member.id));
  const combatHealingItem = state.inventory.find((item) => item.kind === "healing" && item.quantity > 0);
  const showGuildPanel = false;
  const isTempoRunning = tempoMode !== "idle";
  const showGuildFallbackRecruit = state.party.length > 0 || guildCreationStep !== "briefing";
  const recoveryCost = useMemo(() => calculateRecoveryCost(state.party), [state.party]);
  const injuredMembers = useMemo(
    () => state.party.filter((member) => getMemberRecoveryCost(member) > 0),
    [state.party]
  );
  const townShop = defaultWorld.shops.find((shop) => shop.id === "shop.stela-general") ?? defaultWorld.shops[0];
  const draftPreview = useMemo(() => createGuildCharacter({
    ...draft,
    name: draft.name || t("party.namePlaceholder"),
    traitIds: [draft.traitId],
    bonusAptitude: draft.bonusAptitude,
    seed: `bonus:${draft.bonusSeed}`,
    method: "detailed",
    registeredAtTurn: state.turn
  }), [draft, state.turn, t]);
  const selectedProfile = state.party.find((member) => member.id === selectedProfileId) ?? state.party[0] ?? draftPreview;
  const selectedProfileStats = getEffectiveCharacterStats(selectedProfile, defaultWorld);
  const availableShopCategories = useMemo(
    () => SHOP_CATEGORY_ORDER.filter((category) => (townShop.stock ?? []).some((stock) => shopCategoryFor(stock.itemId) === category)),
    [townShop.stock]
  );
  const activeShopCategory: ShopCategory = availableShopCategories.includes(shopCategory)
    ? shopCategory
    : availableShopCategories[0] ?? "weapon";
  const unlockedCheckpoints = useMemo(() => listUnlockedCheckpoints(state, defaultWorld), [state]);
  const carriedLootCount = state.inventory.reduce((total, item) => total + item.quantity, 0);
  const carriedLootSummary = state.inventory.length > 0
    ? state.inventory.map((item) => `${localizedCatalogName(item.id, locale)} x${item.quantity}`).join(" / ")
    : t("town.noLoot");
  const suggestedRecruit = useMemo(
    () => createSuggestedRecruitForParty(state.party, state.turn, locale),
    [locale, state.party, state.turn]
  );
  const suggestedRecruitClass = findClass(suggestedRecruit.classId);
  const suggestedRecruitBackground = findBackground(suggestedRecruit.backgroundId);
  const allocatedBonusPoints = useMemo(() => getAllocatedBonusPoints(draft.bonusAptitude), [draft.bonusAptitude]);
  const remainingBonusPoints = draft.bonusPool - allocatedBonusPoints;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state.phase === "town" && state.log.at(-1)?.event?.type === "returned_to_town") {
      setTownMode("entry");
    }
  }, [state.phase, state.log]);

  useEffect(() => {
    if (state.phase !== "combat") {
      setSelectedTargetId(null);
      setCombatOrders([]);
      return;
    }

    if (!selectedTarget && livingEnemyGroups[0]) {
      setSelectedTargetId(livingEnemyGroups[0].id);
    }
  }, [livingEnemyGroups, selectedTarget, state.phase]);

  useEffect(() => {
    setCombatOrders([]);
  }, [state.phase, state.combat?.round, state.combat?.roomId]);

  function run(command: Command, options: { remember?: boolean; confirm?: boolean } = {}) {
    if (isTempoRunning) {
      setTempoMode("idle");
    }
    setState((current) => executeCommand(current, defaultWorld, command));
    void options;
    setTempoStatus("");
  }

  function enterTownMode(mode: TownMode) {
    if (mode === "shop" && state.party[0]) {
      setSelectedProfileId(state.party[0].id);
    }
    setTownMode(mode);
  }

  function queueSelectedCombatAction(action: CombatActionKind) {
    if (!selectedActor) {
      return;
    }

    if (action === "attack" && (!selectedTarget || !canSelectedActorAttack)) {
      return;
    }

    if (action === "cast" && !selectedTarget) {
      return;
    }

    if (action === "use_item" && !combatHealingItem) {
      return;
    }

    const order: CombatActionDeclaration =
      action === "attack"
        ? { actorId: selectedActor.id, action, targetGroupId: selectedTarget!.id }
        : action === "cast"
          ? { actorId: selectedActor.id, action, spellId: "sleep", targetGroupId: selectedTarget!.id }
          : action === "use_item"
            ? { actorId: selectedActor.id, action, itemId: combatHealingItem!.id, targetCharacterId: selectedActor.id }
            : { actorId: selectedActor.id, action };
    const nextOrders = [...combatOrders.filter((queued) => queued.actorId !== selectedActor.id), order];
    setCombatOrders(nextOrders);
  }

  function queueSelectedCombatSpell(spellId: SpellId) {
    if (!selectedActor) {
      return;
    }
    const spell = SPELLS[spellId];
    if (selectedActor.mp < spell.mpCost) {
      return;
    }

    let order: CombatActionDeclaration;
    if (spell.target === "ally") {
      const wounded = [...state.party]
        .filter((member) => member.hp > 0)
        .sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp)[0];
      order = { actorId: selectedActor.id, action: "cast", spellId, targetCharacterId: (wounded ?? selectedActor).id };
    } else {
      if (!selectedTarget) {
        return;
      }
      order = { actorId: selectedActor.id, action: "cast", spellId, targetGroupId: selectedTarget.id };
    }

    setCombatOrders([...combatOrders.filter((queued) => queued.actorId !== selectedActor.id), order]);
  }

  function executeCombatOrders() {
    if (!combatOrdersReady) {
      return;
    }

    run({ type: "declare_round", actions: combatOrders }, { remember: false });
    setCombatOrders([]);
  }

  function takeBackCombatOrder() {
    const nextOrders = combatOrders.slice(0, -1);
    setCombatOrders(nextOrders);
  }

  function clearCombatOrders() {
    setCombatOrders([]);
  }

  function toggleTempoMode(preferredMode: TempoMode = getTempoModeForPhase(state.phase)) {
    if (tempoMode !== "idle") {
      setTempoMode("idle");
      setTempoStatus(t("tempo.repeatStopped"));
      return;
    }

    if (preferredMode === "idle") {
      setTempoStatus(t("tempo.repeatUnavailable"));
      return;
    }

    setTempoStatus("");
    setTempoMode(preferredMode);
  }

  function loadDebugProgress() {
    setState(createDebugStateFromProgress(defaultWorld, debugProgress));
    setHeadlessStatus("");
  }

  function runHeadless() {
    // Dense floors need a larger walk budget than the old linear layout.
    const result = runHeadlessClear(state, defaultWorld, 300);
    setState(result.state);
    setHeadlessStatus(
      t("debug.headlessReachabilityStatus", {
        reason: result.cleared ? t("debug.reached") : result.reason,
        count: result.commands.length
      })
    );
  }

  function addDraftCharacter() {
    const character = createGuildCharacter({
      ...draft,
      traitIds: [draft.traitId],
      bonusAptitude: draft.bonusAptitude,
      seed: `bonus:${draft.bonusSeed}`,
      method: "detailed",
      registeredAtTurn: state.turn
    });
    setState((current) =>
      current.party.length < PARTY_SIZE_LIMIT
        ? addCharacter(current, character)
        : { ...current, reserve: [...current.reserve, character] }
    );
    setSelectedProfileId(character.id);
    setDraft(createFreshDraft({ classId: draft.classId, backgroundId: draft.backgroundId, traitId: draft.traitId }));
    setGuildCreationStep("class");
  }

  function requestGuildSuggestion() {
    setGuildOfferState("suggestion");
  }

  function declineGuildSuggestion() {
    setGuildOfferState((current) => current === "suggestion" ? "ask" : "dismissed");
  }

  function acceptGuildSuggestion() {
    const character = createSuggestedRecruitForParty(stateRef.current.party, stateRef.current.turn, locale);
    setState((latest) => addCharacter(latest, character));
    setSelectedProfileId(character.id);
    setGuildOfferState("ask");
  }

  function rerollBonusPool() {
    setDraft((current) => {
      const nextSeed = current.bonusSeed + 1;
      return {
        ...current,
        bonusSeed: nextSeed,
        bonusPool: rollBonusPool(nextSeed),
        bonusAptitude: createEmptyBonusAptitude()
      };
    });
  }

  function adjustBonusAptitude(key: keyof CharacterAptitudes, delta: 1 | -1) {
    setDraft((current) => {
      const currentValue = current.bonusAptitude[key];
      const allocated = getAllocatedBonusPoints(current.bonusAptitude);
      if (delta > 0 && allocated >= current.bonusPool) {
        return current;
      }
      if (delta < 0 && currentValue <= 0) {
        return current;
      }

      return {
        ...current,
        bonusAptitude: {
          ...current.bonusAptitude,
          [key]: currentValue + delta
        }
      };
    });
  }

  function setDraftBackground(backgroundId: CharacterBackgroundId) {
    const background = findBackground(backgroundId);
    setDraft((current) => ({
      ...current,
      backgroundId,
      accentColor: background.accentColor
    }));
  }

  function rerollOrigin() {
    setDraft((current) => {
      const originSeed = current.originSeed + 1;
      const currentBackgroundIndex = Math.max(0, backgroundCatalog.findIndex((background) => background.id === current.backgroundId));
      const background = backgroundCatalog[(currentBackgroundIndex + 1) % backgroundCatalog.length];
      const trait = traitCatalog[Math.floor(originSeed * 1.7) % traitCatalog.length];
      return {
        ...current,
        originSeed,
        backgroundId: background.id,
        traitId: trait.id,
        accentColor: background.accentColor
      };
    });
  }

  function rerollIdentity() {
    setDraft((current) => {
      const identitySeed = current.identitySeed + 1;
      return {
        ...current,
        identitySeed,
        ...createIdentitySuggestion({
          seed: identitySeed,
          locale,
          classId: current.classId,
          backgroundId: current.backgroundId,
          traitId: current.traitId
        })
      };
    });
  }

  function enterNameStep() {
    setDraft((current) => {
      if (current.name.trim() || current.title.trim() || current.notes.trim()) {
        return current;
      }

      return {
        ...current,
        ...createIdentitySuggestion({
          seed: current.identitySeed,
          locale,
          classId: current.classId,
          backgroundId: current.backgroundId,
          traitId: current.traitId
        })
      };
    });
    setGuildCreationStep("name");
  }

  async function importPortrait(file: File | undefined) {
    if (!file) {
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result)));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(file);
    });

    setDraft((current) => ({ ...current, portraitRef: dataUrl }));
  }

  function startNewGame() {
    setState(createInitialGameState());
    setDraft(createFreshDraft());
    setGuildCreationStep("briefing");
    setTownMode("guild");
    setSelectedProfileId(null);
    setTempoStatus("");
    setTempoMode("idle");
    setSaveStatus("");
    setScreen("game");
  }

  function saveGame(slotId = saveSlotId, announce = true) {
    if (!saveRepository) {
      setSaveStatus(t("save.unavailable"));
      return;
    }

    const save = toSaveDataV1(state, defaultWorld, { locale });
    saveRepository.write(slotId, save);
    setSaveSlots(saveRepository.list());
    if (announce) {
      setSaveStatus(t("save.saved", { slot: slotId }));
    }
  }

  function loadGame(slotId = saveSlotId, enterGame = true) {
    if (!saveRepository) {
      setSaveStatus(t("save.unavailable"));
      return;
    }

    const result = saveRepository.read(slotId);
    if (!result.ok) {
      setSaveStatus(result.message);
      return;
    }

    setState(fromSaveDataV1(result.save));
    changeLocale(result.save.settings.locale);
    setSaveStatus(createTranslator(result.save.settings.locale)("save.loaded", { slot: slotId }));
    if (enterGame) {
      setScreen("game");
    }
  }

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    persistLocale(nextLocale);
  }

  async function importScenarioPackFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files: ScenarioPackFiles = {};
    for (const file of Array.from(fileList)) {
      const fileWithPath = file as File & { webkitRelativePath?: string };
      const path = (fileWithPath.webkitRelativePath || file.name).replaceAll("__", "/");
      files[path] = await file.text();
    }

    const result = loadScenarioPack(files);
    if (!result.ok) {
      setScenarioImportErrors(result.errors);
      setScenarioImportStatus(t("scenario.importFailed", { count: result.errors.length }));
      return;
    }

    setScenarioImportErrors([]);
    setScenarioImportStatus(
      t("scenario.importLoaded", {
        title: result.manifest.title,
        floors: result.world.dungeons.length
      })
    );
    setHeadlessStatus(formatScenarioSummary(summarizeScenario(result.world)));
  }

  useEffect(() => {
    if (tempoMode === "idle") {
      return;
    }

    const timer = window.setInterval(() => {
      const result = runTempoStep(stateRef.current, tempoMode, defaultWorld, t);
      stateRef.current = result.state;
      setState(result.state);

      if (!result.keepRunning) {
        setTempoMode("idle");
        setTempoStatus(result.status);
      }
    }, 320);

    return () => window.clearInterval(timer);
  }, [tempoMode, t]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if (isTypingTarget(event.target)) {
        if (key === "escape" && event.target instanceof HTMLElement) {
          event.preventDefault();
          event.target.blur();
          activateControllerCancel();
        }
        return;
      }

      // In the dungeon the arrow keys drive the party (up = forward, down =
      // step back, left/right = turn) rather than moving button focus.
      if (
        state.phase === "dungeon" &&
        (key === "arrowup" || key === "arrowdown" || key === "arrowleft" || key === "arrowright")
      ) {
        event.preventDefault();
        if (key === "arrowup") {
          run({ type: "move_forward" });
        } else if (key === "arrowdown") {
          run({ type: "move_backward" });
        } else if (key === "arrowleft") {
          run({ type: "turn_left" });
        } else {
          run({ type: "turn_right" });
        }
        return;
      }

      if (key === "arrowdown" || key === "arrowright" || key === "arrowup" || key === "arrowleft") {
        if (moveControllerFocus(key === "arrowup" || key === "arrowleft" ? -1 : 1)) {
          event.preventDefault();
          return;
        }
      }

      if (key === "escape") {
        event.preventDefault();
        if (activateControllerCancel()) {
          return;
        }
        if (tempoMode !== "idle") {
          setTempoMode("idle");
          setTempoStatus(t("tempo.repeatStopped"));
        }
      } else if ((key === "enter" || key === " ") && isControllerInteractiveTarget(document.activeElement)) {
        return;
      } else if (key === " " || key === "r") {
        event.preventDefault();
        toggleTempoMode();
      } else if (state.phase === "dungeon" && (key === "w" || key === "enter")) {
        event.preventDefault();
        run({ type: "move_forward" });
      } else if (state.phase === "dungeon" && key === "a") {
        event.preventDefault();
        run({ type: "turn_left" });
      } else if (state.phase === "dungeon" && key === "d") {
        event.preventDefault();
        run({ type: "turn_right" });
      } else if (state.phase === "dungeon" && key === "s") {
        event.preventDefault();
        run({ type: "move_backward" });
      } else if (state.phase === "dungeon" && key === "q") {
        event.preventDefault();
        run({ type: "search" });
      } else if (state.phase === "dungeon" && key === "e") {
        event.preventDefault();
        run({ type: "use_stairs" });
      } else if (state.phase === "combat" && (key === "f" || key === "enter")) {
        event.preventDefault();
        if (combatOrdersReady && key === "enter") {
          executeCombatOrders();
        } else {
          queueSelectedCombatAction("attack");
        }
      } else if (state.phase === "combat" && key === "g") {
        event.preventDefault();
        queueSelectedCombatAction("defend");
      } else if (state.phase === "combat" && key === "x") {
        event.preventDefault();
        executeCombatOrders();
      } else if (state.phase === "combat" && key === "backspace") {
        event.preventDefault();
        takeBackCombatOrder();
      } else if (state.phase === "combat" && (key === "arrowright" || key === "arrowleft")) {
        event.preventDefault();
        cycleSelectedTarget(key === "arrowright" ? 1 : -1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combatOrdersReady, isTempoRunning, selectedActor, selectedTarget, state, t, tempoMode]);

  useEffect(() => {
    if (isTypingTarget(document.activeElement)) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      focusFirstControllerChoice();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [guildCreationStep, screen, state.combat?.round, state.phase, townMode]);

  function cycleSelectedTarget(step: number) {
    if (livingEnemyGroups.length === 0) {
      return;
    }

    const index = Math.max(0, livingEnemyGroups.findIndex((group) => group.id === selectedTarget?.id));
    const next = livingEnemyGroups[(index + step + livingEnemyGroups.length) % livingEnemyGroups.length];
    setSelectedTargetId(next.id);
  }

  useEffect(() => {
    if (!saveRepository || debugMode || scenarioValidationErrors.length > 0 || screen !== "game") {
      return;
    }

    saveRepository.write(AUTO_SAVE_SLOT, toSaveDataV1(state, defaultWorld, { locale }));
    setSaveSlots(saveRepository.list());
  }, [debugMode, locale, saveRepository, scenarioValidationErrors.length, screen, state]);

  return (
    <main className={screen === "game" ? "app-shell" : "app-shell title-shell"}>
      {screen !== "game" && (
        <section className="title-screen" aria-labelledby="title-heading">
          <div className="title-mark">
            <span className="title-rule" />
            <h1 id="title-heading">{t("app.title")}</h1>
          </div>
          <nav className="title-menu" aria-label={t("title.menu")} data-controller-active={screen === "title" ? "true" : undefined} data-controller-surface="title">
            <button type="button" className="primary-action" onClick={startNewGame}>
              {t("title.newGame")}
            </button>
            <button type="button" disabled={!hasAutosave} onClick={() => loadGame(AUTO_SAVE_SLOT)}>
              {t("title.continue")}
            </button>
            <button type="button" onClick={() => setScreen(screen === "config" ? "title" : "config")}>
              {t("title.config")}
            </button>
          </nav>
          {screen === "config" && (
            <section
              className="title-config"
              aria-labelledby="title-config-heading"
              data-controller-active="true"
              data-controller-surface="title-config"
            >
              <h2 id="title-config-heading">{t("title.config")}</h2>
              <label>
                {t("locale.label")}
                <select value={locale} onChange={(event) => changeLocale(event.target.value as Locale)}>
                  <option value="en">{t("locale.en")}</option>
                  <option value="ja">{t("locale.ja")}</option>
                </select>
              </label>
            </section>
          )}
          {(saveStatus || hasCorruptAutosave) && (
            <p className="title-status" aria-live="polite">{saveStatus || t("save.corrupt")}</p>
          )}
        </section>
      )}

      {screen === "game" && scenarioValidationErrors.length > 0 ? (
        <ScenarioValidationPanel errors={scenarioValidationErrors} t={t} />
      ) : screen === "game" ? (
        <>
      {debugMode && (
        <section className="debug-panel" aria-labelledby="debug-heading">
          <div>
            <h2 id="debug-heading">{t("debug.heading")}</h2>
            <p>
              {t("debug.visited", {
                visited: state.map.visitedRooms.length,
                total: getTotalRoomCount(),
                phase: formatPhase(state.phase, t)
              })}
            </p>
          </div>
          <label>
            {t("debug.progress")}
            <select
              value={debugProgress}
              onChange={(event) => setDebugProgress(parseDebugProgress(event.target.value))}
            >
              {debugProgressValues.map((progress) => (
                <option key={progress} value={progress}>
                  {formatDebugProgress(progress, t)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={loadDebugProgress}>{t("debug.loadProgress")}</button>
          <button type="button" onClick={runHeadless}>{t("debug.headlessReachability")}</button>
          <label className="scenario-import-control">
            <Upload size={18} />
            {t("scenario.importPack")}
            <input
              data-testid="scenario-pack-input"
              type="file"
              multiple
              accept=".md,.yaml,.yml,.json,text/markdown,text/plain"
              onChange={(event) => importScenarioPackFiles(event.target.files)}
            />
          </label>
          <div className="dev-save-controls" aria-label={t("save.devControls")}>
            <label>
              {t("save.slot")}
              <input
                list="save-slots"
                value={saveSlotId}
                onChange={(event) => setSaveSlotId(event.target.value)}
                aria-label={t("save.slotInput")}
              />
            </label>
            <datalist id="save-slots">
              {saveSlots.map((slot) => (
                <option key={slot.slotId} value={slot.slotId}>
                  {slot.status === "valid" ? slot.savedAt : t("save.corrupt")}
                </option>
              ))}
            </datalist>
            <button type="button" onClick={() => saveGame(saveSlotId)}>
              <Save size={18} />
              {t("save.save")}
            </button>
            <button type="button" onClick={() => loadGame(saveSlotId, false)}>
              <FolderOpen size={18} />
              {t("save.load")}
            </button>
          </div>
          {headlessStatus && <strong>{headlessStatus}</strong>}
          {saveStatus && <strong>{saveStatus}</strong>}
          {scenarioImportStatus && <strong>{scenarioImportStatus}</strong>}
        </section>
      )}
      {debugMode && scenarioImportErrors.length > 0 && (
        <ScenarioValidationPanel errors={scenarioImportErrors} t={t} />
      )}

      <section className={showGuildPanel ? "game-grid with-guild" : "game-grid single-panel"}>
        {showGuildPanel && (
        <aside className="panel party-panel" aria-labelledby="party-heading">
          <div className="section-title">
            <h2 id="party-heading">{t("party.heading")}</h2>
            <span>{state.party.length}/{PARTY_SIZE_LIMIT}</span>
          </div>

          <div className="roster" aria-live="polite">
            {state.party.length === 0 ? (
              null
            ) : (
              state.party.map((member) => (
                <article className="party-member" key={member.id} style={{ borderColor: member.accentColor }}>
                  <div className="portrait">
                    {renderPortraitContent({
                      portraitRef: member.portraitRef,
                      backgroundId: member.backgroundId,
                      fallback: member.name
                    })}
                  </div>
                  <div>
                    <h3>{member.name}</h3>
                    <p>
                      {member.title} / {findClass(member.classId).label[locale]} / {findBackground(member.backgroundId).label[locale]}
                    </p>
                    <small>{member.traitIds.map((traitId) => findTrait(traitId).label[locale]).join(" · ")}</small>
                    <small>
                      {t("party.hpAtk", { hp: member.hp, maxHp: member.maxHp, attack: getEffectiveCharacterStats(member, defaultWorld).attack })}
                    </small>
                    <small>{member.startingEquipment.map((id) => localizedCatalogName(id, locale)).join(" / ")}</small>
                  </div>
                </article>
              ))
            )}
          </div>

          {state.phase === "town" && (
            <form
              className="creator"
              onSubmit={(event) => {
                event.preventDefault();
                addDraftCharacter();
              }}
            >
              <label>
                {t("party.name")}
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder={t("party.namePlaceholder")}
                  required
                />
              </label>
              <label>
                {t("party.title")}
                <input
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder={t("party.titlePlaceholder")}
                />
              </label>
              <div className="creator-grid">
                <label>
                  {t("party.class")}
                  <select
                    aria-label={t("party.class")}
                    value={draft.classId}
                    onChange={(event) => setDraft((current) => ({ ...current, classId: event.target.value as CharacterDraft["classId"] }))}
                  >
                    {classCatalog.map((classDef) => (
                      <option key={classDef.id} value={classDef.id}>{classDef.label[locale]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("party.background")}
                  <select
                    aria-label={t("party.background")}
                    value={draft.backgroundId}
                    onChange={(event) => setDraftBackground(event.target.value as CharacterBackgroundId)}
                  >
                    {backgroundCatalog.map((background) => (
                      <option key={background.id} value={background.id}>{background.label[locale]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("party.trait")}
                  <select
                    aria-label={t("party.trait")}
                    value={draft.traitId}
                    onChange={(event) => setDraft((current) => ({ ...current, traitId: event.target.value as CharacterDraft["traitId"] }))}
                  >
                    {traitCatalog.map((trait) => (
                      <option key={trait.id} value={trait.id}>{trait.label[locale]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("party.aptitude")}
                  <select
                    aria-label={t("party.aptitude")}
                    value={draft.aptitudeFocus}
                    onChange={(event) => setDraft((current) => ({ ...current, aptitudeFocus: event.target.value as CharacterDraft["aptitudeFocus"] }))}
                  >
                    {(["balanced", "might", "agility", "spirit", "wit", "luck"] as const).map((focus) => (
                      <option key={focus} value={focus}>{t(`aptitude.${focus}` as Parameters<Translator>[0])}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                {t("party.notes")}
                <textarea
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder={t("party.notesPlaceholder")}
                />
              </label>
              <div className="origin-support">
                <p className="origin-note">{findBackground(draft.backgroundId).notes[locale]}</p>
                <button type="button" onClick={rerollOrigin}>
                  <Wand2 size={18} />
                  {t("party.rerollOrigin")}
                </button>
              </div>
              <label>
                {t("party.portrait")}
                <input
                  data-testid="portrait-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => importPortrait(event.target.files?.[0])}
                />
              </label>
              <div className="portrait portrait-large" style={{ borderColor: draft.accentColor }}>
                {renderPortraitContent({
                  portraitRef: draft.portraitRef,
                  backgroundId: draft.backgroundId,
                  fallback: draft.name || findClass(draft.classId).label[locale],
                  alt: t("party.portraitPreview"),
                  testId: "portrait-preview"
                })}
              </div>
              <div className="recruit-review" aria-label={t("party.review")}>
                <strong>{draft.name || t("party.namePlaceholder")}</strong>
                <span>{findClass(draft.classId).label[locale]} · {findBackground(draft.backgroundId).label[locale]} · {findTrait(draft.traitId).label[locale]}</span>
              </div>
              <button type="submit" disabled={state.party.length >= PARTY_SIZE_LIMIT}>{t("party.add")}</button>
            </form>
          )}
        </aside>
        )}

        <section className="panel play-panel" aria-labelledby="location-heading">
          <div className="section-title">
            <h2 id="location-heading">{state.phase === "town" ? t("play.town") : state.phase === "combat" ? t("play.combat") : roomText?.name}</h2>
            <span>{state.position ? t("play.facing", { direction: t(`direction.${state.position.facing}`) }) : t("play.safe")}</span>
          </div>

          {state.phase === "town" ? (
            <div className="town-view">
              <div
                className="town-mode-tabs"
                aria-label="Town modes"
                data-controller-active={townMode !== "guild" || state.party.length >= PARTY_SIZE_LIMIT ? "true" : undefined}
                data-controller-surface="town-tabs"
              >
                <button type="button" onClick={() => enterTownMode("guild")}>{t("town.guild")}</button>
                <button type="button" onClick={() => enterTownMode("shop")}>{t("town.shop")}</button>
                <button type="button" onClick={() => enterTownMode("recovery")}>{t("town.recovery")}</button>
                <button type="button" onClick={() => enterTownMode("records")}>{t("town.records")}</button>
                <button type="button" onClick={() => enterTownMode("entry")}>{t("town.entry")}</button>
              </div>
              {townMode === "guild" && (
                <section className="guild-studio" aria-labelledby="party-heading">
                  <div className="studio-header">
                    <div>
                      <h3 id="party-heading">{t("party.studioHeading")}</h3>
                      <p>{t("party.studioCopy")}</p>
                    </div>
                    <span>{state.party.length}/{PARTY_SIZE_LIMIT}</span>
                  </div>

                  <div className={`guild-studio-grid${state.party.length >= PARTY_SIZE_LIMIT ? " full-party" : ""}`}>
                    {state.party.length >= PARTY_SIZE_LIMIT ? (
                      <section
                        className="guild-ready-panel"
                        aria-label={t("party.partyReadyHeading")}
                      >
                        <h4>{t("party.partyReadyHeading")}</h4>
                        <p>{t("party.partyReadyCopy")}</p>
                      </section>
                    ) : (
                      <form
                        className="creator studio-creator guild-flow"
                        onSubmit={(event) => {
                          event.preventDefault();
                          addDraftCharacter();
                        }}
                      >
                      <ol className="guild-stepper" aria-label={t("party.creationSteps")}>
                        {guildStepOrder.map((step) => (
                          <li className={guildCreationStep === step ? "active" : ""} key={step}>
                            <button type="button" onClick={() => setGuildCreationStep(step)}>
                              {t(`party.step.${step}` as Parameters<Translator>[0])}
                            </button>
                          </li>
                        ))}
                      </ol>

                      {guildCreationStep === "briefing" && (
                        <section className="guild-step-panel" data-controller-active="true" data-controller-surface="guild-briefing" data-testid="guild-step-briefing">
                          <h4>{t("party.guildMaster")}</h4>
                          <p>{t("party.guildBriefing")}</p>
                          <div className="flow-actions">
                            <button type="button" className="primary-action" onClick={() => setGuildCreationStep("class")}>
                              {t("party.startRegistration")}
                            </button>
                            <button type="button" onClick={() => setGuildCreationStep("class")}>
                              {t("party.skipBriefing")}
                            </button>
                          </div>
                        </section>
                      )}

                      {guildCreationStep === "class" && (
                        <section className="guild-step-panel" data-controller-active="true" data-controller-surface="guild-class" data-testid="guild-step-class">
                          <h4>{t("party.chooseClass")}</h4>
                          <div className="class-card-grid">
                            {classCatalog.map((classDef) => (
                              <button
                                type="button"
                                className={draft.classId === classDef.id ? "class-card selected" : "class-card"}
                                key={classDef.id}
                                onClick={() => setDraft((current) => ({ ...current, classId: classDef.id }))}
                              >
                                <strong>{classDef.label[locale]}</strong>
                                <span>{formatCombatRow(classDef.rowPreference, t)}</span>
                                <small>{classDef.description[locale]}</small>
                                <small className="class-gear">{t("party.equipment")}: {Object.values(classDef.equipment).map((id) => localizedCatalogName(id, locale)).join(" / ")}</small>
                              </button>
                            ))}
                          </div>
                          <div className="flow-actions">
                            <button type="button" data-controller-cancel="true" onClick={() => setGuildCreationStep("briefing")}>{t("party.back")}</button>
                            <button type="button" className="primary-action" onClick={() => setGuildCreationStep("appearance")}>{t("party.next")}</button>
                          </div>
                        </section>
                      )}

                      {guildCreationStep === "appearance" && (
                        <section className="guild-step-panel" data-controller-active="true" data-controller-surface="guild-appearance" data-testid="guild-step-appearance">
                          <h4>{t("party.chooseAppearance")}</h4>
                          <div className="creator-topline">
                            <div className="portrait portrait-large" style={{ borderColor: draft.accentColor }}>
                              {renderPortraitContent({
                                portraitRef: draft.portraitRef,
                                backgroundId: draft.backgroundId,
                                fallback: draft.name || findClass(draft.classId).label[locale],
                                alt: t("party.portraitPreview"),
                                testId: "portrait-preview"
                              })}
                            </div>
                            <label className="portrait-import">
                              {t("party.portrait")}
                              <input
                                data-testid="portrait-input"
                                type="file"
                                accept="image/*"
                                onChange={(event) => importPortrait(event.target.files?.[0])}
                              />
                            </label>
                          </div>
                          <div className="creator-grid compact">
                            <label>
                              {t("party.background")}
                              <select
                                aria-label={t("party.background")}
                                value={draft.backgroundId}
                                onChange={(event) => setDraftBackground(event.target.value as CharacterBackgroundId)}
                              >
                                {backgroundCatalog.map((background) => (
                                  <option key={background.id} value={background.id}>{background.label[locale]}</option>
                                ))}
                              </select>
                            </label>
                            <label>
                              {t("party.trait")}
                              <select
                                aria-label={t("party.trait")}
                                value={draft.traitId}
                                onChange={(event) => setDraft((current) => ({ ...current, traitId: event.target.value as CharacterDraft["traitId"] }))}
                              >
                                {traitCatalog.map((trait) => (
                                  <option key={trait.id} value={trait.id}>{trait.label[locale]}</option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="origin-support">
                            <p className="origin-note">{findBackground(draft.backgroundId).notes[locale]}</p>
                            <button type="button" onClick={rerollOrigin}>
                              <Wand2 size={18} />
                              {t("party.rerollOrigin")}
                            </button>
                          </div>
                          <div className="flow-actions">
                            <button type="button" data-controller-cancel="true" onClick={() => setGuildCreationStep("class")}>{t("party.back")}</button>
                            <button type="button" className="primary-action" onClick={() => setGuildCreationStep("bonus")}>{t("party.next")}</button>
                          </div>
                        </section>
                      )}

                      {guildCreationStep === "bonus" && (
                        <section className="guild-step-panel" data-controller-active="true" data-controller-surface="guild-bonus" data-testid="guild-step-bonus">
                          <div className="bonus-heading">
                            <div>
                              <h4>{t("party.allocateBonus")}</h4>
                              <p>{t("party.bonusRemaining", { remaining: remainingBonusPoints, pool: draft.bonusPool })}</p>
                            </div>
                            <button type="button" onClick={rerollBonusPool}>
                              <Wand2 size={18} />
                              {t("party.rerollBonus")}
                            </button>
                          </div>
                          <div className="bonus-grid" aria-label={t("party.allocateBonus")}>
                            {aptitudeKeys.map((key) => (
                              <div className="bonus-row" key={key}>
                                <span>{t(`aptitude.${key}` as Parameters<Translator>[0])}</span>
                                <button
                                  type="button"
                                  aria-label={`${t(`aptitude.${key}` as Parameters<Translator>[0])} -`}
                                  disabled={draft.bonusAptitude[key] <= 0}
                                  onClick={() => adjustBonusAptitude(key, -1)}
                                >
                                  -
                                </button>
                                <strong>{draftPreview.aptitude[key]}</strong>
                                <small>{draft.bonusAptitude[key] > 0 ? `+${draft.bonusAptitude[key]}` : ""}</small>
                                <button
                                  type="button"
                                  aria-label={`${t(`aptitude.${key}` as Parameters<Translator>[0])} +`}
                                  disabled={remainingBonusPoints <= 0}
                                  onClick={() => adjustBonusAptitude(key, 1)}
                                >
                                  +
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="bonus-summary" data-testid="stat-preview" aria-label={t("party.statPreview")}>
                            HP {draftPreview.maxHp} / {t("party.damage")} {draftPreview.damageMin}-{draftPreview.damageMax} / {t("party.accuracy")} {draftPreview.accuracy} / {t("party.speed")} {draftPreview.speed}
                          </p>
                          <div className="flow-actions">
                            <button type="button" data-controller-cancel="true" onClick={() => setGuildCreationStep("appearance")}>{t("party.back")}</button>
                            <button type="button" className="primary-action" disabled={remainingBonusPoints > 0} onClick={enterNameStep}>{t("party.next")}</button>
                          </div>
                        </section>
                      )}

                      {guildCreationStep === "name" && (
                        <section className="guild-step-panel" data-controller-active="true" data-controller-surface="guild-name" data-testid="guild-step-name">
                          <div className="bonus-heading">
                            <div>
                              <h4>{t("party.nameAdventurer")}</h4>
                              <p>{t("party.identityCopy")}</p>
                            </div>
                            <button type="button" onClick={rerollIdentity}>
                              <Wand2 size={18} />
                              {t("party.rerollIdentity")}
                            </button>
                          </div>
                          <div className="creator-grid compact">
                            <label>
                              {t("party.name")}
                              <input
                                value={draft.name}
                                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                                placeholder={t("party.namePlaceholder")}
                                required
                              />
                            </label>
                            <label>
                              {t("party.title")}
                              <input
                                value={draft.title}
                                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                                placeholder={t("party.titlePlaceholder")}
                              />
                            </label>
                          </div>
                          <label>
                            {t("party.notes")}
                            <textarea
                              value={draft.notes}
                              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                              placeholder={t("party.notesPlaceholder")}
                            />
                          </label>
                          <section className="recruit-review" aria-label={t("party.review")}>
                            <strong>{draft.name || t("party.namePlaceholder")}</strong>
                            <span>{findClass(draft.classId).label[locale]} · {findBackground(draft.backgroundId).label[locale]} · {findTrait(draft.traitId).label[locale]}</span>
                            <small>{formatAptitudes(draftPreview.aptitude, t)}</small>
                          </section>
                          <div className="flow-actions">
                            <button type="button" data-controller-cancel="true" onClick={() => setGuildCreationStep("bonus")}>{t("party.back")}</button>
                            <button type="submit" className="primary-action" disabled={state.party.length >= PARTY_SIZE_LIMIT || remainingBonusPoints > 0}>
                              {t("party.add")}
                            </button>
                          </div>
                        </section>
                      )}
                      </form>
                    )}

                    <section
                      className="studio-roster guild-side-panel"
                      aria-label={t("party.heading")}
                      data-controller-active={state.party.length >= PARTY_SIZE_LIMIT ? "true" : undefined}
                      data-controller-surface="guild-roster"
                    >
                      {state.party.length < PARTY_SIZE_LIMIT && (
                        <section className="guild-tavern-panel" aria-label={t("party.tavern")}>
                          <div className="guild-tavern-scene" aria-hidden="true">
                            <div className="guild-master-figure">
                              <span className="guild-master-head" />
                              <span className="guild-master-body" />
                            </div>
                            <span className="tavern-lantern" />
                            <span className="tavern-counter" />
                            <span className="tavern-table" />
                          </div>
                          {showGuildFallbackRecruit && (
                            <div className="guild-master-dialogue">
                              <strong>{t("party.guildMaster")}</strong>
                              {guildOfferState === "ask" && (
                                <>
                                <p>{t("party.quickRecruitPrompt")}</p>
                                <div className="binary-actions" aria-label={t("party.quickActions")}>
                                  <button type="button" className="primary-action" onClick={requestGuildSuggestion}>
                                    {t("party.quickRecruitYes")}
                                  </button>
                                  <button type="button" onClick={declineGuildSuggestion}>
                                    {t("party.quickRecruitNo")}
                                  </button>
                                </div>
                                </>
                              )}
                              {guildOfferState === "suggestion" && (
                                <article className="guild-candidate-card" data-testid="guild-suggestion">
                                <p>{t("party.quickRecruitProposal")}</p>
                                <div className="candidate-heading">
                                  <div className="portrait" style={{ borderColor: suggestedRecruit.accentColor }}>
                                    {renderPortraitContent({
                                      portraitRef: suggestedRecruit.portraitRef,
                                      backgroundId: suggestedRecruit.backgroundId,
                                      fallback: suggestedRecruit.name
                                    })}
                                  </div>
                                  <div>
                                    <strong>{suggestedRecruit.name}</strong>
                                    <span>{formatCharacterSummary(suggestedRecruit, locale, t)}</span>
                                  </div>
                                </div>
                                <dl className="candidate-details">
                                  <div>
                                    <dt>{t("party.candidateQuestion")}</dt>
                                    <dd>{suggestedRecruitClass.description[locale]}</dd>
                                  </div>
                                  <div>
                                    <dt>{t("party.background")}</dt>
                                    <dd>{suggestedRecruitBackground.notes[locale]}</dd>
                                  </div>
                                  <div>
                                    <dt>{t("party.equipment")}</dt>
                                    <dd>{suggestedRecruit.startingEquipment.map((id) => localizedCatalogName(id, locale)).join(" / ")}</dd>
                                  </div>
                                </dl>
                                <div className="binary-actions" aria-label={t("party.quickRecruitProposal")}>
                                  <button type="button" className="primary-action" onClick={acceptGuildSuggestion}>
                                    {t("party.quickRecruitYes")}
                                  </button>
                                  <button type="button" onClick={declineGuildSuggestion}>
                                    {t("party.quickRecruitNo")}
                                  </button>
                                </div>
                                </article>
                              )}
                              {guildOfferState === "dismissed" && (
                                <p>{t("party.quickRecruitDismissed")}</p>
                              )}
                            </div>
                          )}
                        </section>
                      )}

                      {state.party.length > 0 && (
                        <div className="guild-entry-strip">
                          {latestLogText && <p className="event-window" aria-live="polite">{latestLogText}</p>}
                          <button
                            type="button"
                            className="primary-action"
                            onClick={() => run({ type: "enter_dungeon" })}
                          >
                            <DoorOpen size={18} />
                            {t("play.enterDungeon")}
                          </button>
                        </div>
                      )}

                      <div className="roster roster-compact formation-roster" aria-live="polite">
                        {state.party.length === 0 ? (
                          null
                        ) : (
                          (["front", "back"] as const).map((row) => {
                            const rowMembers = state.party.filter((member) => member.row === row);
                            return (
                              <section
                                className="formation-row"
                                data-testid={`guild-${row}-row`}
                                aria-label={formatCombatRow(row, t)}
                                key={row}
                              >
                                <h4>{formatCombatRow(row, t)}</h4>
                                <div className="formation-slots">
                                  {rowMembers.map((member) => (
                                    <div className="formation-slot" key={member.id}>
                                      <button
                                        type="button"
                                        className={member.id === selectedProfile.id ? "party-member selected" : "party-member"}
                                        style={{ borderColor: member.accentColor }}
                                        onClick={() => setSelectedProfileId(member.id)}
                                      >
                                        <div className="portrait">
                                          {renderPortraitContent({
                                            portraitRef: member.portraitRef,
                                            backgroundId: member.backgroundId,
                                            fallback: member.name
                                          })}
                                        </div>
                                        <div>
                                          <strong>{member.name}</strong>
                                          <span>{formatCharacterSummary(member, locale, t)}</span>
                                          <small>{t("party.hpAtk", { hp: member.hp, maxHp: member.maxHp, attack: member.attack })}</small>
                                        </div>
                                      </button>
                                      <button
                                        type="button"
                                        className="roster-action"
                                        onClick={() => run({ type: "bench_member", characterId: member.id })}
                                      >
                                        {t("party.bench")}
                                      </button>
                                    </div>
                                  ))}
                                  {Array.from({ length: Math.max(0, 3 - rowMembers.length) }).map((_, index) => (
                                    <div className="formation-slot-empty" aria-hidden="true" key={`${row}-${index}`} />
                                  ))}
                                </div>
                              </section>
                            );
                          })
                        )}
                      </div>

                      {state.reserve.length > 0 && (
                        <section className="formation-row reserve-row" aria-label={t("party.reserveHeading")} data-testid="guild-reserve">
                          <h4>{t("party.reserveHeading")} ({state.reserve.length})</h4>
                          <div className="formation-slots">
                            {state.reserve.map((member) => (
                              <div className="formation-slot" key={member.id}>
                                <div className="party-member reserve-member" style={{ borderColor: member.accentColor }}>
                                  <div className="portrait">
                                    {renderPortraitContent({
                                      portraitRef: member.portraitRef,
                                      backgroundId: member.backgroundId,
                                      fallback: member.name
                                    })}
                                  </div>
                                  <div>
                                    <strong>{member.name}</strong>
                                    <span>{formatCharacterSummary(member, locale, t)}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="roster-action"
                                  disabled={state.party.length >= PARTY_SIZE_LIMIT}
                                  onClick={() => run({ type: "recall_member", characterId: member.id })}
                                >
                                  {t("party.recall")}
                                </button>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {state.party.length > 0 && (
                      <article className="character-profile" data-testid="character-profile" aria-label={t("party.profile")}>
                        <div className="profile-heading">
                          <div className="portrait portrait-large" style={{ borderColor: selectedProfile.accentColor }}>
                            {renderPortraitContent({
                              portraitRef: selectedProfile.portraitRef,
                              backgroundId: selectedProfile.backgroundId,
                              fallback: selectedProfile.name,
                              testId: "profile-portrait"
                            })}
                          </div>
                          <div>
                            <h4>{selectedProfile.name}</h4>
                            <p>{formatCharacterSummary(selectedProfile, locale, t, { includeRow: false })} / {findBackground(selectedProfile.backgroundId).label[locale]}</p>
                            <small>{selectedProfile.traitIds.map((traitId) => findTrait(traitId).label[locale]).join(" · ")}</small>
                          </div>
                        </div>
                        <p className="profile-notes">{formatCharacterNotes(selectedProfile.notes, selectedProfile.backgroundId, locale) || t("party.noNotes")}</p>
                        <dl>
                          <div><dt>HP</dt><dd>{selectedProfile.hp}/{selectedProfile.maxHp}</dd></div>
                          <div><dt>{t("party.damage")}</dt><dd>{selectedProfileStats.damageMin}-{selectedProfileStats.damageMax}</dd></div>
                          <div><dt>{t("party.armor")}</dt><dd>{selectedProfileStats.armor}</dd></div>
                          <div><dt>{t("party.speed")}</dt><dd>{selectedProfileStats.speed}</dd></div>
                          <div><dt>{t("party.row")}</dt><dd>{formatCombatRow(selectedProfile.row, t)}</dd></div>
                          <div><dt>{t("party.equipment")}</dt><dd>{selectedProfile.startingEquipment.map((id) => localizedCatalogName(id, locale)).join(" / ")}</dd></div>
                          <div><dt>{t("party.deepestFloor")}</dt><dd>{selectedProfile.memory.deepestFloorId ?? "-"}</dd></div>
                          <div><dt>{t("party.victories")}</dt><dd>{selectedProfile.memory.notableVictories.length}</dd></div>
                          <div><dt>{t("party.injuries")}</dt><dd>{selectedProfile.memory.injuries}</dd></div>
                        </dl>
                      </article>
                      )}
                    </section>
                  </div>
                </section>
              )}
              {townMode === "entry" && (
                <section
                  className="town-service town-cockpit"
                  aria-labelledby="town-status-heading"
                  data-testid="town-cockpit"
                  data-controller-active="true"
                  data-controller-surface="town-entry"
                >
                  <div className="service-heading">
                    <div>
                      <h3 id="town-status-heading">{t("town.statusHeading")}</h3>
                      <p>{t("town.statusCopy")}</p>
                    </div>
                    <strong>{t("town.gold", { gold: state.partyGold })}</strong>
                  </div>
                  <div className="town-cockpit-grid">
                    <div className="town-scene" aria-hidden="true">
                      <div className="town-skyline" />
                      <div className="town-gate">
                        <span className="town-lantern left" />
                        <span className="town-stela" />
                        <span className="town-lantern right" />
                      </div>
                      <div className="town-steps" />
                    </div>
                    <dl className="town-status-ledger">
                      <div>
                        <dt>{t("town.expeditionResult")}</dt>
                        <dd>{latestLogText || t("town.readyToDescend")}</dd>
                      </div>
                      <div>
                        <dt>{t("town.wounds")}</dt>
                        <dd>{injuredMembers.length > 0 ? injuredMembers.map((member) => `${member.name} ${member.hp}/${member.maxHp}`).join(" / ") : t("town.noWounds")}</dd>
                      </div>
                      <div>
                        <dt>{t("town.loot")}</dt>
                        <dd>{carriedLootCount > 0 ? carriedLootSummary : t("town.noLoot")}</dd>
                      </div>
                      <div>
                        <dt>{t("town.nextPreparation")}</dt>
                        <dd>{recoveryCost > 0 ? t("town.nextRecovery") : state.inventory.some((item) => item.kind === "equipment") ? t("town.nextShop") : t("town.readyToDescend")}</dd>
                      </div>
                    </dl>
                  </div>
                  {unlockedCheckpoints.length > 0 && (
                    <div className="checkpoint-resume" data-testid="checkpoint-resume">
                      <h4>{t("play.checkpointsHeading")}</h4>
                      <div className="checkpoint-list">
                        {unlockedCheckpoints.map((checkpoint) => (
                          <button
                            type="button"
                            key={checkpoint.roomId}
                            data-testid={`resume-${checkpoint.roomId}`}
                            disabled={state.party.length === 0}
                            onClick={() => run({ type: "resume_at_checkpoint", roomId: checkpoint.roomId })}
                          >
                            {t("play.resumeAt", { place: getLocalizedRoomText(defaultWorld, checkpoint.roomId, locale).name })}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="town-action-strip">
                    <button type="button" onClick={() => enterTownMode("recovery")}>{t("town.recovery")}</button>
                    <button type="button" onClick={() => enterTownMode("shop")}>{t("town.shop")}</button>
                    <button
                      type="button"
                      className="primary-action"
                      disabled={state.party.length === 0}
                      onClick={() => run({ type: "enter_dungeon" })}
                    >
                      <DoorOpen size={18} />
                      {t("play.enterDungeon")}
                    </button>
                  </div>
                </section>
              )}
              {townMode === "recovery" && (
                <section
                  className="town-service"
                  aria-labelledby="recovery-heading"
                  data-controller-active="true"
                  data-controller-surface="town-recovery"
                >
                  <h3 id="recovery-heading">{t("town.recoveryHeading")}</h3>
                  {latestLogText && isRecoveryEventType(latestEventType) && <p className="event-window" aria-live="polite">{latestLogText}</p>}
                  <p className="town-ledger">
                    <strong>{t("town.gold", { gold: state.partyGold })}</strong>
                    <span>{t("town.recoveryCost", { gold: recoveryCost })}</span>
                  </p>
                  <div className="recovery-plan" data-testid="recovery-plan">
                    {state.party.map((member) => {
                      const memberCost = getMemberRecoveryCost(member);
                      return (
                        <article className={memberCost > 0 ? "recovery-row injured" : "recovery-row"} key={member.id}>
                          <strong>{member.name}</strong>
                          <span>{member.hp}/{member.maxHp}</span>
                          <small>
                            {memberCost > 0
                              ? t("town.recoveryMemberPlan", { cost: memberCost, after: member.maxHp })
                              : t("town.noTreatmentNeeded")}
                          </small>
                        </article>
                      );
                    })}
                  </div>
                  <p className="town-ledger">
                    <span>{recoveryCost > 0 ? t("town.afterRecovery", { count: injuredMembers.length }) : t("town.noRecoveryNeeded")}</span>
                    {state.partyGold < recoveryCost && <strong>{t("town.cannotAffordRecovery")}</strong>}
                  </p>
                  <button
                    type="button"
                    disabled={recoveryCost <= 0 || state.partyGold < recoveryCost}
                    onClick={() => run({ type: "recover_party" })}
                  >
                    {t("town.recoverParty")}
                  </button>
                </section>
              )}
              {townMode === "shop" && townShop && (
                <section
                  className="town-service shop-service"
                  aria-labelledby="shop-heading"
                  data-controller-active="true"
                  data-controller-surface="town-shop"
                >
                  <div className="service-heading">
                    <h3 id="shop-heading">{localizedShopName(townShop, locale)}</h3>
                    <strong>{t("town.gold", { gold: state.partyGold })}</strong>
                  </div>
                  {latestLogText && isShopEventType(latestEventType) && <p className="event-window" aria-live="polite">{latestLogText}</p>}
                  <section className="shop-adventurer-panel" aria-label={t("town.selectedAdventurer")}>
                    <div>
                      <strong>{t("town.selectedAdventurer")}: {selectedProfile.name}</strong>
                      <span>
                        {t("town.equipmentSummary", {
                          attack: selectedProfileStats.damageMax,
                          accuracy: selectedProfileStats.accuracy,
                          armorValue: selectedProfileStats.armor,
                          speed: selectedProfileStats.speed
                        })}
                      </span>
                    </div>
                    <div className="shop-party-select">
                      {state.party.map((member) => (
                        <button
                          type="button"
                          className={member.id === selectedProfile.id ? "selected" : ""}
                          key={member.id}
                          onClick={() => setSelectedProfileId(member.id)}
                        >
                          {member.name}
                        </button>
                      ))}
                    </div>
                  </section>
                  <div className="shop-grid">
                    <section aria-label={t("town.shopStock")}>
                      <h4>{t("town.shopStock")}</h4>
                      <div className="shop-category-tabs" role="tablist">
                        {availableShopCategories.map((category) => (
                          <button
                            type="button"
                            role="tab"
                            aria-selected={category === activeShopCategory}
                            className={category === activeShopCategory ? "selected" : ""}
                            data-testid={`shop-category-${category}`}
                            key={category}
                            onClick={() => setShopCategory(category)}
                          >
                            {t(`town.category.${category}` as Parameters<Translator>[0])}
                          </button>
                        ))}
                      </div>
                      <div className="shop-list">
                        {townShop.stock?.filter((stock) => shopCategoryFor(stock.itemId) === activeShopCategory).map((stock) => {
                          const equipment = findEquipmentById(stock.itemId);
                          const selectedCanEquip = equipment ? isEquipmentUsableBy(equipment, selectedProfile) : false;
                          const previewStats = equipment ? previewEquipmentStats(selectedProfile, equipment) : null;
                          return (
                            <article className="shop-row" key={stock.itemId}>
                              <div>
                                <strong>{localizedCatalogName(stock.itemId, locale)}</strong>
                                <span>
                                  {equipment
                                    ? `${formatEquipmentSlot(equipment.slot, t)} · ${formatEquipmentEffect(equipment, t)}`
                                    : t("town.price", { gold: stock.price })}
                                </span>
                                {equipment && <small>{localizedCatalogDescription(stock.itemId, locale)}</small>}
                                {equipment && (
                                  <small data-testid="shop-delta">
                                    {selectedCanEquip
                                      ? t("town.canEquip", { member: selectedProfile.name })
                                      : t("town.cannotEquip", { member: selectedProfile.name })}
                                    {selectedCanEquip && previewStats
                                      ? ` · ${formatStatDelta(selectedProfileStats, previewStats, t)}`
                                      : ""}
                                  </small>
                                )}
                                {equipment && <small>{t("town.price", { gold: stock.price })}</small>}
                                <small>{t("town.remainingGold", { gold: Math.max(0, state.partyGold - stock.price) })}</small>
                              </div>
                              <button
                                type="button"
                                aria-label={`${t("town.buy")} ${localizedCatalogName(stock.itemId, locale)}`}
                                disabled={state.partyGold < stock.price}
                                onClick={() => run({ type: "buy_item", shopId: townShop.id, itemId: stock.itemId })}
                              >
                                {t("town.buy")}
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                    <section aria-label={t("town.inventory")}>
                      <h4>{t("town.inventory")}</h4>
                      <div className="shop-list">
                        {state.inventory.length === 0 ? (
                          <p className="empty-state">{t("town.inventoryEmpty")}</p>
                        ) : (
                          state.inventory.map((item) => (
                            <article className="shop-row" key={item.id}>
                              <div>
                                <strong>{localizedCatalogName(item.id, locale)}</strong>
                                <span>
                                  {item.kind === "equipment" && item.slot
                                    ? `${formatEquipmentSlot(item.slot, t)} · ${formatInventoryEffect(item, t)}`
                                    : t("town.quantity", { count: item.quantity })}
                                </span>
                                {item.kind === "equipment" && <small>{localizedCatalogDescription(item.id, locale)}</small>}
                                {item.kind === "equipment" && <small>{t("town.quantity", { count: item.quantity })}</small>}
                              </div>
                              <button
                                type="button"
                                disabled={(item.sellValue ?? 0) <= 0 || state.party.some((member) => Object.values(member.equipment).includes(item.id))}
                                onClick={() => run({ type: "sell_item", itemId: item.id })}
                              >
                                {t("town.sell")}
                              </button>
                            </article>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                  <section className="equipment-board" aria-label={t("town.equipment")}>
                    <h4>{t("town.equipment")}</h4>
                    <article className="equipment-row">
                      <div>
                        <strong>{selectedProfile.name}</strong>
                        <span>
                          {t("town.equipmentSummary", {
                            attack: selectedProfileStats.damageMax,
                            accuracy: selectedProfileStats.accuracy,
                            armorValue: selectedProfileStats.armor,
                            speed: selectedProfileStats.speed
                          })}
                        </span>
                        <dl className="equipment-slots">
                          {equipmentSlotOrder.map((slot) => (
                            <div key={`${selectedProfile.id}:${slot}`}>
                              <dt>{formatEquipmentSlot(slot, t)}</dt>
                              <dd>{equippedName(selectedProfile.equipment[slot], locale)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      <div className="equipment-actions">
                        {state.inventory.filter((item) => item.kind === "equipment").map((item) => {
                          const equipment = findEquipmentById(item.id);
                          const usable = equipment ? isEquipmentUsableBy(equipment, selectedProfile) : false;
                          return (
                            <button
                              type="button"
                              key={`${selectedProfile.id}:${item.id}`}
                              aria-label={`${t("town.equip")} ${localizedCatalogName(item.id, locale)} to ${selectedProfile.name}`}
                              disabled={!usable}
                              onClick={() => run({ type: "equip_item", characterId: selectedProfile.id, equipmentId: item.id })}
                            >
                              {localizedCatalogName(item.id, locale)}
                              <small>{usable ? t("town.allowed") : t("town.ineligible")}</small>
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  </section>
                </section>
              )}
              {townMode === "records" && (
                <section className="town-service" aria-labelledby="records-heading">
                  <h3 id="records-heading">{t("town.recordsHeading")}</h3>
                  <p>{t("town.logCount", { count: state.log.length })}</p>
                  {state.log.length > 0 && (
                    <ol className="records-list">
                      {state.log.slice().reverse().slice(0, 8).map((entry) => (
                        <li key={entry.id}>
                          <small>{t("log.turn", { turn: entry.turn })}</small>
                          <p>{entry.event ? projectEventToLog(entry.event, locale, defaultWorld)?.text ?? entry.text : entry.text}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              )}
              {townMode === "records" && (
                <>
                  <p>
                    {t("play.townCopy")}
                  </p>
                  <div
                    className="town-action-strip"
                    data-controller-active="true"
                    data-controller-surface="town-actions"
                  >
                    {latestLogText && <p className="event-window" aria-live="polite">{latestLogText}</p>}
                    <button
                      type="button"
                      className="primary-action"
                      disabled={state.party.length === 0}
                      onClick={() => run({ type: "enter_dungeon" })}
                    >
                      <DoorOpen size={18} />
                      {t("play.enterDungeon")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={`adventure-cockpit ${state.phase === "combat" ? "combat-cockpit" : "dungeon-cockpit"}`}>
              <div className="scene-deck">
                <DungeonView state={state} world={defaultWorld} label={t("play.dungeonView")} />
                {state.phase === "dungeon" && (
                  <aside className="navigation-board" aria-label={t("map.heading")}>
                    <MapPanel state={state} world={defaultWorld} locale={locale} t={t} />
                  </aside>
                )}
              </div>

              {state.phase === "dungeon" && (
                <div className="party-hud" data-testid="party-hud" aria-label={t("play.partyStatus")}>
                  {(["front", "back"] as const).map((row) => (
                    <div className="party-row-strip" data-testid={`party-${row}-row`} key={row}>
                      <span>{row === "front" ? t("play.frontRow") : t("play.backRow")}</span>
                      <div className="party-row-slots">
                        {state.party.filter((member) => member.row === row).map((member) => {
                          const stats = getEffectiveCharacterStats(member, defaultWorld);
                          return (
                            <div
                              className={`party-token ${member.row} ${
                                member.injury || member.hp <= 0
                                  ? "down"
                                  : member.hp <= Math.ceil(member.maxHp * 0.35)
                                    ? "danger"
                                    : ""
                              }`}
                              data-testid="party-token"
                              key={member.id}
                              style={{ borderColor: member.accentColor }}
                            >
                              <div className="party-token-portrait" style={{ borderColor: member.accentColor }}>
                                {renderPortraitContent({
                                  portraitRef: member.portraitRef,
                                  backgroundId: member.backgroundId,
                                  fallback: member.name,
                                  alt: member.name,
                                  testId: "party-hud-portrait"
                                })}
                              </div>
                              <div className="party-token-body">
                                <div className="party-token-heading">
                                  <strong>{member.name}</strong>
                                  <small>{formatCharacterSummary(member, locale, t, { includeRow: false })}</small>
                                  {member.status && member.status.filter((status) => status !== "ward").length > 0 && (
                                    <small className="party-token-status">
                                      {member.status.filter((status) => status !== "ward").join(" · ")}
                                    </small>
                                  )}
                                </div>
                                <div className="party-token-stats" aria-label={t("play.memberStatus")}>
                                  <span>Lv {member.level}</span>
                                  <span>HP {member.hp}/{member.maxHp}</span>
                                  {member.maxMp > 0 && <span>{t("play.mpShort")} {member.mp}/{member.maxMp}</span>}
                                  <span>{t("party.damage")} {stats.damageMin}-{stats.damageMax}</span>
                                  <span>{t("party.armor")} {stats.armor}</span>
                                  <span>{t("party.speed")} {stats.speed}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {state.phase === "dungeon" && (
                <div className="room-copy cockpit-copy">
                  <p>{roomText?.description}</p>
                </div>
              )}
              <p className="event-window cockpit-message" aria-live="polite">{tempoStatus || latestLogText || "\u00a0"}</p>
              {state.phase === "combat" ? (
                <section className="battle-screen" aria-label={t("play.battleScreen")}>
                  <div className="battle-header">
                    <strong>{t("play.round", { round: state.combat?.round ?? 1 })}</strong>
                    <span>
                      {selectedActor && selectedTarget
                        ? t("play.selectedOrder", { actor: selectedActor.name, target: localizedEnemyGroupName(selectedTarget, locale) })
                        : combatOrdersReady
                          ? t("play.orderReady")
                          : t("play.selectOrder")}
                    </span>
                  </div>

                  <div className="battle-grid">
                    <div className="battle-side" aria-label={t("play.enemyGroups")}>
                      <h3>{t("play.enemyGroups")}</h3>
                      {livingEnemyGroups.map((group) => (
                        <div
                          key={group.id}
                          className={group.id === selectedTarget?.id ? "battle-choice enemy-choice selected" : "battle-choice enemy-choice"}
                          data-testid="combat-enemy-group"
                          role="listitem"
                          aria-current={group.id === selectedTarget?.id ? "true" : undefined}
                        >
                          <strong>{localizedEnemyGroupName(group, locale)}</strong>
                          <span>{formatEnemyGroupStatus(group, t)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="battle-side formation-side" aria-label={t("play.partyFormation")}>
                      <h3>{t("play.partyFormation")}</h3>
                      {(["front", "back"] as const).map((row) => (
                        <div className="battle-row" data-testid={`combat-${row}-row`} key={row}>
                          <span>{row === "front" ? t("play.frontRow") : t("play.backRow")}</span>
                          <div className="formation-slots">
                            {state.party.filter((member) => member.row === row).map((member) => (
                              <div
                                role="listitem"
                                key={member.id}
                                className={`battle-choice ${member.id === selectedActor?.id ? "selected" : ""} ${
                                  orderedActorIds.has(member.id) ? "ordered" : ""
                                }`}
                                data-testid="combat-actor"
                                aria-current={member.id === selectedActor?.id ? "step" : undefined}
                              >
                                <strong>{member.name}</strong>
                                <span>{t("play.actorStatus", { hp: member.hp, maxHp: member.maxHp, row: formatCombatRow(member.row, t) })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="battle-order" aria-label={t("play.battleOrder")}>
                    <div className="battle-order-header">
                      <h3>{t("play.battleOrder")}</h3>
                      <span>{t("play.orderProgress", { ready: combatOrders.length, total: activeParty.length })}</span>
                    </div>
                    {combatOrders.length > 0 ? (
                      <ol data-testid="combat-order-list">
                        {combatOrders.map((order, index) => (
                          <li key={`${order.actorId}:${index}`}>{formatCombatOrder(order, state, locale, t)}</li>
                        ))}
                      </ol>
                    ) : (
                      <p data-testid="combat-order-list">{t("play.orderEmpty")}</p>
                    )}
                  </div>

                  <div
                    className="command-bar command-dock"
                    aria-label={t("play.combatCommands")}
                    data-controller-active="true"
                    data-controller-surface="combat-commands"
                    data-testid="combat-command-window"
                  >
                    <button type="button" aria-pressed={isTempoRunning} onClick={() => toggleTempoMode("combat")}>
                      {isTempoRunning ? <Square size={18} /> : <Repeat2 size={18} />}
                      {isTempoRunning ? t("tempo.stop") : t("tempo.repeat")}
                    </button>
                    <button type="button" disabled={!canSelectedActorAttack} onClick={() => queueSelectedCombatAction("attack")}>
                      <Sword size={18} />
                      {t("play.attack")}
                    </button>
                    <button type="button" disabled={!canCycleCombatTarget} onClick={() => cycleSelectedTarget(1)}>
                      <ArrowRight size={18} />
                      {t("play.targetNext")}
                    </button>
                    <button type="button" disabled={!selectedActor} onClick={() => queueSelectedCombatAction("defend")}>
                      <ShieldCheck size={18} />
                      {t("play.defend")}
                    </button>
                    {selectedActor &&
                      knownSpells(selectedActor.classId, selectedActor.level).map((spellId) => {
                        const spell = SPELLS[spellId];
                        const needsTarget = spell.target === "enemyGroup" && !selectedTarget;
                        return (
                          <button
                            key={spellId}
                            type="button"
                            disabled={selectedActor.mp < spell.mpCost || needsTarget}
                            onClick={() => queueSelectedCombatSpell(spellId)}
                          >
                            <Wand2 size={18} />
                            {t(SPELL_LABEL_KEY[spellId])} · {t("play.mpShort")} {spell.mpCost}
                          </button>
                        );
                      })}
                    {combatHealingItem && selectedActor && (
                      <button
                        type="button"
                        onClick={() => queueSelectedCombatAction("use_item")}
                      >
                        <ShieldCheck size={18} />
                        {t("play.useItem")}
                      </button>
                    )}
                    <button type="button" disabled={!combatOrdersReady} onClick={executeCombatOrders}>
                      <Sword size={18} />
                      {t("play.fight")}
                    </button>
                    <button type="button" data-controller-cancel="true" disabled={combatOrders.length === 0} onClick={takeBackCombatOrder}>
                      <ShieldCheck size={18} />
                      {t("play.takeBack")}
                    </button>
                    <button type="button" disabled={combatOrders.length === 0} onClick={clearCombatOrders}>
                      <Square size={18} />
                      {t("play.clearOrders")}
                    </button>
                    <button type="button" onClick={() => run({ type: "retreat" })}>
                      <ShieldCheck size={18} />
                      {t("play.retreat")}
                    </button>
                  </div>
                </section>
              ) : (
                <div
                  className="command-bar command-dock"
                  aria-label={t("play.dungeonCommands")}
                  data-controller-active="true"
                  data-controller-surface="dungeon-commands"
                  data-testid="dungeon-command-window"
                >
                  <button type="button" aria-pressed={isTempoRunning} onClick={() => toggleTempoMode("dungeon")}>
                    {isTempoRunning ? <Square size={18} /> : <Repeat2 size={18} />}
                    {isTempoRunning ? t("tempo.stop") : t("tempo.repeat")}
                  </button>
                  <button type="button" aria-label={t("play.turnLeft")} onClick={() => run({ type: "turn_left" })}>
                    <ArrowLeft size={18} />
                  </button>
                  <button type="button" onClick={() => run({ type: "move_forward" })}>
                    <Footprints size={18} />
                    {t("play.move")}
                  </button>
                  <button type="button" onClick={() => run({ type: "move_backward" })}>
                    <ArrowDown size={18} />
                    {t("play.moveBack")}
                  </button>
                  <button type="button" aria-label={t("play.turnRight")} onClick={() => run({ type: "turn_right" })}>
                    <ArrowRight size={18} />
                  </button>
                  <button type="button" onClick={() => run({ type: "search" })}>
                    <Search size={18} />
                    {t("play.search")}
                  </button>
                  <button type="button" onClick={() => run({ type: "listen" })}>
                    <Volume2 size={18} />
                    {t("play.listen")}
                  </button>
                  {canUseStairs && (
                    <button type="button" className="context-command" onClick={() => run({ type: "use_stairs" })}>
                      <DoorOpen size={18} />
                      {t("play.useStairs")}
                    </button>
                  )}
                  {canReturnToTown && (
                    <button type="button" className="context-command" onClick={() => run({ type: "return_to_town" })}>
                      <LogOut size={18} />
                      {currentRoom?.returnStyle === "stairs" ? t("play.useReturnStairs") : t("play.useReturnMarker")}
                    </button>
                  )}
                  {canUseEscapeItem && escapeItem && (
                    <button
                      type="button"
                      className="context-command"
                      data-testid="use-return-charm"
                      onClick={() => run({ type: "use_item", itemId: escapeItem.id, targetCharacterId: state.party[0]?.id ?? "" })}
                    >
                      <LogOut size={18} />
                      {t("play.useReturnCharm")}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </section>
        </>
      ) : null}
    </main>
  );
}

function isDebugModeEnabled() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";
}

function createFreshDraft(overrides: Partial<CharacterDraft> = {}): CharacterDraft {
  const seed = overrides.bonusSeed ?? Date.now();
  const backgroundId = overrides.backgroundId ?? defaultDraft.backgroundId;
  const background = findBackground(backgroundId);
  return {
    ...defaultDraft,
    backgroundId,
    bonusSeed: seed,
    originSeed: overrides.originSeed ?? seed,
    identitySeed: overrides.identitySeed ?? seed,
    bonusPool: rollBonusPool(seed),
    bonusAptitude: createEmptyBonusAptitude(),
    ...overrides,
    accentColor: overrides.accentColor ?? background.accentColor
  };
}

function createEmptyBonusAptitude(): CharacterAptitudes {
  return { might: 0, agility: 0, spirit: 0, wit: 0, luck: 0 };
}

function rollBonusPool(seed: number) {
  return 4 + (Math.floor(Math.abs(Math.sin(seed * 12.9898) * 10_000)) % 5);
}

function createSuggestedRecruitForParty(party: Character[], turn: number, locale: Locale) {
  const classId = chooseSuggestedClassId(party);
  const background = backgroundCatalog[(party.length + turn) % backgroundCatalog.length];
  const trait = traitCatalog[(party.length * 3 + turn + 1) % traitCatalog.length];
  const identity = createIdentitySuggestion({
    seed: turn + party.length * 19 + classCatalog.findIndex((classDef) => classDef.id === classId) * 5,
    locale,
    classId,
    backgroundId: background.id,
    traitId: trait.id
  });

  return createGuildCharacter({
    ...identity,
    classId,
    backgroundId: background.id,
    traitIds: [trait.id],
    method: "quick",
    seed: `guild-suggestion:${turn}:${party.length}:${classId}`,
    registeredAtTurn: turn
  });
}

function chooseSuggestedClassId(party: Character[]): CharacterClassId {
  const roleCount = (role: string) => party.filter((member) => member.roleTags.includes(role)).length;
  const frontCount = party.filter((member) => member.row === "front").length;
  const backCount = party.filter((member) => member.row === "back").length;
  const partyIndex = party.length % 3;

  if (frontCount < 2) {
    return ["vanguard", "bulwark", "sellsword"][partyIndex] as CharacterClassId;
  }

  if (roleCount("healing") < 1) {
    return party.some((member) => member.classId === "mender") ? "chanter" : "mender";
  }

  if (roleCount("trap_handling") < 1) {
    return party.some((member) => member.classId === "cutpurse") ? "seeker" : "cutpurse";
  }

  if (roleCount("mapping") < 1) {
    return backCount <= frontCount ? "wayfinder" : "scout";
  }

  if (roleCount("damage") < 2) {
    return frontCount < 3 ? "duelist" : "arcanist";
  }

  if (roleCount("status_safety") < 1) {
    return "occultist";
  }

  return backCount < 3 ? "arcanist" : "sellsword";
}

function renderPortraitContent({
  portraitRef,
  backgroundId,
  fallback,
  alt = "",
  testId
}: {
  portraitRef?: string;
  backgroundId: CharacterBackgroundId;
  fallback: string;
  alt?: string;
  testId?: string;
}) {
  if (portraitRef && !portraitRef.startsWith("debug://")) {
    return <img data-testid={testId} src={portraitRef} alt={alt} />;
  }

  const background = findBackground(backgroundId);
  const mark = fallback.trim().slice(0, 1) || background.label.en.slice(0, 1);
  return (
    <span
      className={`portrait-asset portrait-asset-${background.portraitKey}`}
      data-testid={testId}
      aria-label={alt || background.label.en}
    >
      {mark}
    </span>
  );
}

function getAllocatedBonusPoints(bonus: CharacterAptitudes) {
  return aptitudeKeys.reduce((total, key) => total + bonus[key], 0);
}

function getDebugProgressFromLocation() {
  if (typeof window === "undefined") {
    return "ready";
  }

  return parseDebugProgress(new URLSearchParams(window.location.search).get("progress"));
}

function getTotalRoomCount() {
  return defaultWorld.dungeons.reduce((total, dungeon) => total + dungeon.rooms.length, 0);
}

function createBrowserSaveRepository() {
  if (typeof window === "undefined") {
    return null;
  }

  return new LocalStorageSaveRepository(window.localStorage);
}


function formatCombatOrder(order: CombatActionDeclaration, state: GameState, locale: Locale, t: Translator) {
  const actor = state.party.find((member) => member.id === order.actorId);
  const target = state.combat?.enemyGroups.find((group) => group.id === order.targetGroupId);
  const action = formatCombatAction(order.action, t);
  if (target) {
    return t("play.orderWithTarget", { actor: actor?.name ?? order.actorId, action, target: localizedEnemyGroupName(target, locale) });
  }

  return t("play.orderWithoutTarget", { actor: actor?.name ?? order.actorId, action });
}

function formatEnemyGroupStatus(group: CombatEnemyGroup, t: Translator) {
  const ratio = group.maxHpEach > 0 ? group.hpEach / group.maxHpEach : 0;
  const condition = ratio <= 0.35
    ? t("play.enemyConditionWeak")
    : ratio < 1
      ? t("play.enemyConditionWounded")
      : t("play.enemyConditionFresh");
  return t("play.enemyGroupStatus", { count: group.count, condition });
}

function formatCombatAction(action: CombatActionKind, t: Translator) {
  switch (action) {
    case "attack":
      return t("play.attack");
    case "defend":
      return t("play.defend");
    case "use_item":
      return t("play.useItem");
    case "cast":
      return t("play.sleep");
  }
}

function formatAptitudes(aptitude: CharacterAptitudes, t: Translator) {
  return (["might", "agility", "spirit", "wit", "luck"] as const)
    .map((key) => `${t(`aptitude.${key}` as Parameters<Translator>[0])} ${aptitude[key]}`)
    .join(" / ");
}

function formatCharacterTitle(title: string, classId: GameState["party"][number]["classId"], locale: Locale) {
  const classDef = findClass(classId);
  return title === classDef.label.en ? classDef.label[locale] : title;
}

function formatCharacterSummary(
  member: GameState["party"][number],
  locale: Locale,
  t: Translator,
  options: { includeRow?: boolean } = {}
) {
  const classDef = findClass(member.classId);
  const title = formatCharacterTitle(member.title, member.classId, locale);
  const row = options.includeRow === false ? "" : formatCombatRow(member.row, t);
  const parts = isDefaultClassTitle(member.title, member.classId)
    ? [classDef.label[locale], row]
    : [title, classDef.label[locale], row];

  return Array.from(new Set(parts.filter(Boolean))).join(" / ");
}

function isDefaultClassTitle(title: string, classId: GameState["party"][number]["classId"]) {
  const classDef = findClass(classId);
  const defaultAliases: Partial<Record<GameState["party"][number]["classId"], string[]>> = {
    vanguard: ["Vanguard", "前衛"],
    seeker: ["Seeker", "探索者"],
    mender: ["Mender", "癒し手"],
    occultist: ["Occultist", "秘術師"]
  };
  return [classDef.label.en, classDef.label.ja, ...(defaultAliases[classId] ?? [])].includes(title);
}

function formatCharacterNotes(notes: string, backgroundId: GameState["party"][number]["backgroundId"], locale: Locale) {
  const background = findBackground(backgroundId);
  return notes === background.notes.en ? background.notes[locale] : notes;
}

function localizedShopName(shop: (typeof defaultWorld.shops)[number], locale: Locale) {
  return shop.locales?.[locale]?.name ?? shop.name;
}

function getScenarioValidationErrorsFromLocation(): ScenarioValidationError[] {
  if (typeof window === "undefined") {
    return [];
  }

  if (new URLSearchParams(window.location.search).get("scenario") !== "invalid") {
    return [];
  }

  return [
    {
      filePath: "dungeons/b1f.md",
      fieldPath: "rooms[0].exits.east",
      reason: "Exit references unknown room: room.missing"
    }
  ];
}
