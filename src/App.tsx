import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Compass,
  DoorOpen,
  Wand2
} from "lucide-react";
import { DungeonView } from "./components/DungeonView";
import { MapPanel } from "./components/MapPanel";
import { ScenarioValidationPanel } from "./components/ScenarioValidationPanel";
import { TitleScreen } from "./components/TitleScreen";
import { CampPanel } from "./components/CampPanel";
import { FloorMapOverlay } from "./components/FloorMapOverlay";
import { DebugPanel } from "./components/DebugPanel";
import { DungeonCommandDock } from "./components/DungeonCommandDock";
import { CombatCommandDock } from "./components/CombatCommandDock";
import { CombatCommandMenu } from "./components/CombatCommandMenu";
import { CombatLog } from "./components/CombatLog";
import { CombatResultPanel, type CombatResult } from "./components/CombatResultPanel";
import { CombatEnemyStage } from "./components/CombatEnemyStage";
import { CombatPartyStrip } from "./components/CombatPartyStrip";
import { RecoveryPanel } from "./components/RecoveryPanel";
import { RecordsPanel } from "./components/RecordsPanel";
import { TownEntryPanel } from "./components/TownEntryPanel";
import { ShopPanel } from "./components/ShopPanel";
import { TempoIndicator } from "./components/TempoIndicator";
import { createInitialGameState, addCharacter } from "./domain/gameState";
import {
  backgroundCatalog,
  classCatalog,
  createGuildCharacter,
  findBackground,
  findClass,
  findTrait,
  PARTY_SIZE_LIMIT,
  toPortableAdventurer,
  traitCatalog
} from "./domain/characterCreation";
import { readVault, depositToVault, removeFromVault, type VaultEntry } from "./domain/adventurerVault";
import { getGridEdge, getLocalizedRoomText, getRoom, isBossFloor } from "./domain/scenario";
import { createIdentitySuggestion } from "./domain/identitySuggestion";
import { executeCommand, listUnlockedCheckpoints, remapRepeatOrders, roomStairsEdge, stairGateAhead } from "./domain/rulesEngine";
import { autoCombatStopStatus, chooseAutoRoundActions, getTempoModeForPhase, runTempoStep, type TempoMode } from "./domain/tempo";
import { SPELLS, isCasterClass, knownSpells, type SpellId } from "./domain/spells";
import {
  activateControllerCancel,
  focusFirstControllerChoice,
  moveControllerFocus,
  moveControllerFocusDirection,
  isControllerInteractiveTarget,
  isTypingTarget
} from "./ui/controllerFocus";
import {
  formatAptitudes,
  formatBonusParts,
  formatCombatRow,
  formatEnemyGroupStatus,
  formatEquipmentSlot,
  formatSignedBonus,
  formatSignedDelta,
  getMemberRecoveryCost,
  isRecoveryEventType,
} from "./ui/format";
import {
  SHOP_CATEGORY_ORDER,
  formatCharacterNotes,
  formatCharacterSummary,
  formatCombatOrder,
  localizedCatalogName,
  localizedEnemyGroupName,
  shopCategoryFor,
  type ShopCategory
} from "./ui/catalog";
import { equipmentInstanceKey } from "./domain/affixes";
import { collectCombatBeats } from "./domain/combatLog";
import { formatCombatBeat } from "./domain/combatBeatText";
import { projectEventToLog } from "./domain/replayLog";
import { calculateRecoveryCost, getEffectiveCharacterStats, isEquipmentUsableBy, weaponReaches } from "./domain/economy";
import type {
  CharacterAptitudes,
  CharacterBackgroundId,
  Character,
  CharacterClassId,
  CharacterTraitId,
  CombatActionDeclaration,
  CombatBeat,
  CombatActionKind,
  CombatEnemyGroup,
  Command,
  Direction,
  GameState,
  InventoryItem,
  ScenarioEquipment
} from "./domain/types";
import {
  createDebugStateFromProgress,
  parseDebugProgress,
  withDebugStartCell,
  type DebugProgress
} from "./debug/debugStart";
import { debugAutoExplore, runHeadlessClear } from "./headless/headlessRunner";
import { defaultWorld } from "./data/defaultWorld";
import { fromSaveDataV1, toSaveDataV1 } from "./domain/saveData";
import { LocalStorageSaveRepository, type SaveSlotSummary } from "./services/saveRepository";
import { createTranslator, type Locale, type Translator } from "./i18n";
import {
  loadAutoBattleSafety,
  loadConfirmRound,
  loadInstantCombatLog,
  loadLocale,
  saveAutoBattleSafety,
  saveConfirmRound,
  saveInstantCombatLog,
  saveLocale as persistLocale
} from "./services/settingsRepository";
import type { ScenarioValidationError } from "./domain/scenarioPack";
import { loadScenarioPack, type ScenarioPackFiles } from "./services/scenarioPackLoader";
import { formatScenarioSummary, summarizeScenario } from "./services/scenarioSummary";
import {
  aptitudeKeys,
  createEmptyBonusAptitude,
  createFreshDraft,
  createSuggestedRecruitForParty,
  getAllocatedBonusPoints,
  rollBonusPool,
  type CharacterDraft
} from "./ui/characterDraft";
import { cssArtVariables, portraitUrl, setActiveArtPack } from "./ui/artAssets";

type GuildCreationStep = "briefing" | "class" | "appearance" | "bonus" | "name";
type GuildOfferState = "ask" | "suggestion" | "dismissed";
type TownMode = "guild" | "shop" | "recovery" | "records" | "entry";
type AppScreen = "title" | "config" | "game";

const AUTO_SAVE_SLOT = "autosave";
const guildStepOrder: GuildCreationStep[] = ["briefing", "class", "appearance", "bonus", "name"];

export function App() {
  const [debugMode] = useState(() => isDebugModeEnabled());
  // Debug tools collapse to a thin bar by default so debug mode stays playable —
  // the full panel otherwise shrinks the game view. Auto-explore lives in the
  // dungeon command dock, so it's reachable while the panel is collapsed.
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [debugProgress, setDebugProgress] = useState<DebugProgress>(() => getDebugProgressFromLocation());
  const scenarioValidationErrors = useMemo(() => getScenarioValidationErrorsFromLocation(), []);
  const [state, setState] = useState<GameState>(() =>
    debugMode ? createDebugStateFromLocation() : createInitialGameState()
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
  const [autoBattleSafety, setAutoBattleSafety] = useState<boolean>(() => loadAutoBattleSafety());
  const [instantCombatLog, setInstantCombatLog] = useState<boolean>(() => loadInstantCombatLog());
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [confirmRound, setConfirmRound] = useState<boolean>(() => loadConfirmRound());
  const [revealedBeats, setRevealedBeats] = useState(0);
  const t = useMemo(() => createTranslator(locale), [locale]);

  // Point the art resolver at the active world's asset pack and publish the CSS-
  // referenced art (minimap markers, title, combat vignette) as :root custom
  // properties, so those resolve through the same pack-scoped resolver as sprites/
  // icons instead of being pinned to one world's hard-coded file paths.
  useEffect(() => {
    setActiveArtPack(defaultWorld.assetPack ?? "default");
    const root = document.documentElement;
    for (const [name, value] of Object.entries(cssArtVariables())) {
      root.style.setProperty(name, value);
    }
  }, []);
  const [saveSlotId, setSaveSlotId] = useState(AUTO_SAVE_SLOT);
  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>(() => createBrowserSaveRepository()?.list() ?? []);
  const [saveStatus, setSaveStatus] = useState("");
  const [tempoStatus, setTempoStatus] = useState("");
  const [tempoMode, setTempoMode] = useState<TempoMode>("idle");
  // Repeat/auto tempo feedback (Lane X): a visible speed tier and a live step
  // counter so the runner never reads as a stalled or hidden timer.
  const [tempoSpeed, setTempoSpeed] = useState<"normal" | "fast">("normal");
  const [tempoStep, setTempoStep] = useState(0);
  const [guildCreationStep, setGuildCreationStep] = useState<GuildCreationStep>("briefing");
  const [guildOfferState, setGuildOfferState] = useState<GuildOfferState>("ask");
  const [campOpen, setCampOpen] = useState(false);
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const [combatOrders, setCombatOrders] = useState<CombatActionDeclaration[]>([]);
  // The last fully-declared round, remembered so リピート (Repeat) can re-run the
  // same orders once without re-navigating the menu. Cleared when a fight ends.
  const [lastCombatOrders, setLastCombatOrders] = useState<CombatActionDeclaration[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [shopCategory, setShopCategory] = useState<ShopCategory>("weapon");
  const [reclassClassId, setReclassClassId] = useState<CharacterClassId | "">("");
  const [eraseConfirmId, setEraseConfirmId] = useState<string | null>(null);
  const [editProfileId, setEditProfileId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", title: "", notes: "", accentColor: "#c9a765" });
  const vaultStorage = useMemo(() => (typeof window !== "undefined" ? window.localStorage : null), []);
  const [vault, setVault] = useState<VaultEntry[]>(() => (vaultStorage ? readVault(vaultStorage) : []));

  const depositMember = useCallback(
    (character: Character) => {
      if (!vaultStorage) {
        return;
      }
      const portable = toPortableAdventurer(character, defaultWorld);
      setVault(depositToVault(vaultStorage, portable, crypto.randomUUID()));
    },
    [vaultStorage]
  );

  const removeVaultEntry = useCallback(
    (vaultId: string) => {
      if (!vaultStorage) {
        return;
      }
      setVault(removeFromVault(vaultStorage, vaultId));
    },
    [vaultStorage]
  );
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
  // A stair is used from the current cell, regardless of which way the party faces.
  const canUseStairs = Boolean(
    state.position && roomStairsEdge(defaultWorld, state.position.roomId, state.position.facing)
  );
  // A stair the party faces but can't yet use (crank not turned, floor not mapped).
  const blockingStairGate = stairGateAhead(defaultWorld, state);
  const stairGateClue = blockingStairGate
    ? blockingStairGate.locales?.[locale]?.clue ?? blockingStairGate.clue ?? null
    : null;

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

  // #69: every blow of the CURRENT fight as its own beat line (with numbers),
  // gathered from the round-resolved events since the last encounter began. The
  // view reveals them one at a time so a round no longer flashes past.
  // Not gated on phase: a one-round kill flips straight to the dungeon, so the
  // killing blows must still reveal there (see the post-combat tail below).
  const combatBeats = useMemo(() => collectCombatBeats(state.log), [state.log]);
  const localizeEnemyName = useCallback(
    (enemyId: string) => localizedEnemyGroupName({ enemyId, name: enemyId }, locale),
    [locale]
  );
  const formatBeatLine = useCallback(
    (beat: CombatBeat) => formatCombatBeat(beat, t, localizeEnemyName),
    [t, localizeEnemyName]
  );

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
  // Command entry follows classic DRPG order: the front row receives commands
  // first, then the back row, preserving formation order within each row (a stable
  // sort). Without this the raw party-array order can start on a back-row caster.
  const commandOrder = useMemo(
    () => [...activeParty].sort((a, b) => (a.row === "front" ? 0 : 1) - (b.row === "front" ? 0 : 1)),
    [activeParty]
  );
  const selectedActor = commandOrder.find((member) => !orderedActorIds.has(member.id)) ?? null;
  const frontRowStanding = activeParty.some((member) => member.row === "front");
  const canSelectedActorAttack = Boolean(
    selectedActor &&
      selectedTarget &&
      !(selectedActor.row === "back" && frontRowStanding && !weaponReaches(selectedActor, defaultWorld))
  );
  const canCycleCombatTarget = livingEnemyGroups.length > 1;
  const combatOrdersReady = state.phase === "combat" && activeParty.length > 0 && activeParty.every((member) => orderedActorIds.has(member.id));
  const combatHealingItem = state.inventory.find((item) => item.kind === "healing" && item.quantity > 0);
  // Every usable combat consumable (heal / cure / 気力 restore), for the item submenu.
  const combatConsumables = useMemo(
    () =>
      state.inventory
        .filter((item) => (item.kind === "healing" || item.kind === "cure" || item.kind === "focus") && item.quantity > 0)
        .map((item) => ({ id: item.id, label: `${item.name} ×${item.quantity}` })),
    [state.inventory]
  );
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
      setLastCombatOrders([]);
      return;
    }

    if (!selectedTarget && livingEnemyGroups[0]) {
      setSelectedTargetId(livingEnemyGroups[0].id);
    }
  }, [livingEnemyGroups, selectedTarget, state.phase]);

  useEffect(() => {
    setCombatOrders([]);
  }, [state.phase, state.combat?.round, state.combat?.roomId]);

  // #69 (real fix): a manually declared round PLAYS OUT blow-by-blow before the
  // result is committed. `playback` holds the round's structured beats plus the
  // already-resolved `pending` state; the battlefield renders from the current
  // beat's snapshot (enemies fall as the hit lands) until the last beat commits.
  const [playback, setPlayback] = useState<{ beats: CombatBeat[]; index: number; pending: GameState } | null>(null);
  const activeBeat = playback ? playback.beats[playback.index] ?? null : null;

  function commitPlayback() {
    if (playback) {
      setState(playback.pending);
      setPlayback(null);
    }
  }

  useEffect(() => {
    if (!playback) {
      return;
    }
    if (playback.index >= playback.beats.length - 1) {
      // Hold on the finishing blow a beat longer, then commit the real result.
      const timer = setTimeout(() => {
        setState(playback.pending);
        setPlayback(null);
      }, tempoSpeed === "fast" ? 300 : 700);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setPlayback((current) => (current ? { ...current, index: current.index + 1 } : null));
    }, tempoSpeed === "fast" ? 170 : 430);
    return () => clearTimeout(timer);
  }, [playback, tempoSpeed]);

  // While a round is playing out, the battlefield renders from the current beat's
  // snapshot (pre-round metadata + the beat's live counts/HP) so enemies fall and
  // HP drains in step with each blow. Off-playback it renders the real state.
  const displayedEnemyGroups = useMemo(() => {
    if (!activeBeat || !state.combat) {
      return livingEnemyGroups;
    }
    // Keep count-0 groups visible during playback so the FINISHING blow's number
    // lands on the group before it vanishes (they render as "defeated").
    return state.combat.enemyGroups.map((group) => {
      const snap = activeBeat.groups.find((entry) => entry.id === group.id);
      return snap ? { ...group, count: snap.count, hpEach: snap.hpEach } : group;
    });
  }, [activeBeat, state.combat, livingEnemyGroups]);

  const displayedParty = useMemo(() => {
    if (!activeBeat) {
      return state.party;
    }
    return state.party.map((member) => {
      const snap = activeBeat.party.find((entry) => entry.id === member.id);
      return snap ? { ...member, hp: snap.hp } : member;
    });
  }, [activeBeat, state.party]);

  // Post-victory result screen: when a new combat_rewards event lands (after the
  // playback commits), gather the XP/gold/defeated + any same-turn level-ups and
  // hold them on screen until dismissed. The hydration guard skips rewards already
  // in a loaded log so a resumed game does not pop a stale result.
  const combatResultSeenRef = useRef<string | null>(null);
  const combatResultHydratedRef = useRef(false);
  useEffect(() => {
    const rewardEntry = [...state.log].reverse().find((entry) => entry.event?.type === "combat_rewards");
    const latestId = rewardEntry?.id ?? null;
    if (!combatResultHydratedRef.current) {
      combatResultHydratedRef.current = true;
      combatResultSeenRef.current = latestId;
      return;
    }
    if (!rewardEntry || rewardEntry.event?.type !== "combat_rewards" || latestId === combatResultSeenRef.current) {
      return;
    }
    combatResultSeenRef.current = latestId;
    const reward = rewardEntry.event;
    const levelUps = state.log
      .filter((entry) => entry.event?.type === "character_leveled_up" && entry.turn === rewardEntry.turn)
      .map((entry) => (entry.event?.type === "character_leveled_up" ? { name: entry.event.characterName, level: entry.event.level } : null))
      .filter((entry): entry is { name: string; level: number } => entry !== null);
    const enemyNames = (reward.enemyIds ?? []).map((id) => localizeEnemyName(id));
    setCombatResult({ enemyNames: enemyNames.length > 0 ? enemyNames : reward.enemyNames, xp: reward.xp, gold: reward.gold, levelUps });
  }, [state.log]);

  // On first mount (e.g. Continue into the dungeon) snap any beats already in the
  // loaded log to fully-revealed, so a resumed game does not replay an old fight.
  const combatLogHydratedRef = useRef(false);
  useEffect(() => {
    if (combatLogHydratedRef.current) {
      return;
    }
    combatLogHydratedRef.current = true;
    if (state.phase !== "combat") {
      setRevealedBeats(combatBeats.length);
    }
  }, [combatBeats.length, state.phase]);

  // #69 reveal pacing: keep the revealed count within bounds and honor the instant
  // setting; a new fight (beats reset to empty) rewinds the reveal to zero.
  useEffect(() => {
    if (instantCombatLog || combatBeats.length === 0) {
      setRevealedBeats(combatBeats.length);
      return;
    }
    setRevealedBeats((current) => Math.min(current, combatBeats.length));
  }, [combatBeats.length, instantCombatLog]);

  // Tick the next beat into view; cadence tracks the tempo speed so auto-battle at
  // ×2 reads faster without losing the blow-by-blow feel.
  useEffect(() => {
    if (instantCombatLog || revealedBeats >= combatBeats.length) {
      return;
    }
    const delay = tempoSpeed === "fast" ? 120 : 300;
    const timer = setTimeout(() => {
      setRevealedBeats((current) => Math.min(current + 1, combatBeats.length));
    }, delay);
    return () => clearTimeout(timer);
  }, [revealedBeats, combatBeats.length, instantCombatLog, tempoSpeed]);

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

  // The keyboard "act" key (F): queue the current actor's sensible default — attack
  // if it can reach, otherwise defend — so the round never STALLS on a back-row
  // member who can't strike. Every press advances to the next actor.
  function queueSmartCombatAction() {
    if (!selectedActor) {
      return;
    }
    queueSelectedCombatAction(canSelectedActorAttack ? "attack" : "defend");
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

  // Resolve a manually declared round. When paced playback is on (default), hold
  // the resolved state and play the round's beats forward first so the battlefield
  // updates blow-by-blow; instant mode (or a beatless round) commits immediately.
  function resolveRound(actions: CombatActionDeclaration[], opts: { fromAuto?: boolean } = {}) {
    if (playback) {
      return;
    }
    const resolved = executeCommand(state, defaultWorld, { type: "declare_round", actions });
    setLastCombatOrders(actions);
    setCombatOrders([]);
    if (!opts.fromAuto) {
      setTempoStatus("");
    }
    const roundEntry = [...resolved.log].reverse().find((entry) => entry.event?.type === "combat_round_resolved");
    const beats = roundEntry?.event?.type === "combat_round_resolved" ? roundEntry.event.beats ?? [] : [];
    if (instantCombatLog || beats.length === 0) {
      setState(resolved);
      return;
    }
    // A manual round stops any running tempo; an auto round keeps it going so the
    // next round fires once this one finishes animating.
    if (isTempoRunning && !opts.fromAuto) {
      setTempoMode("idle");
    }
    setPlayback({ beats, index: 0, pending: resolved });
  }

  function executeCombatOrders() {
    if (!combatOrdersReady) {
      return;
    }
    resolveRound(combatOrders);
  }

  // Queue one actor's order via the command menu; when the last active member is
  // commanded the round resolves automatically (classic command-RPG flow — no
  // separate "execute" press).
  function queueCombatOrder(order: CombatActionDeclaration) {
    const nextOrders = [...combatOrders.filter((queued) => queued.actorId !== order.actorId), order];
    const allQueued = activeParty.length > 0 && activeParty.every((member) => nextOrders.some((queued) => queued.actorId === member.id));
    if (allQueued && !confirmRound) {
      resolveRound(nextOrders);
    } else {
      // With confirm ON (default) the full set of orders waits for an explicit
      // "戦う" — you entered them deliberately, so a confirm beat is the default.
      setCombatOrders(nextOrders);
    }
  }

  // リピート (Repeat): re-run the previous round's declared orders exactly once,
  // remapping actors who fell (dropped) and orders aimed at a now-dead enemy group
  // (retargeted to the first living group). オート (Auto) is the continuous loop;
  // this is the single-shot "do that again".
  function repeatLastRound() {
    if (state.phase !== "combat" || combatOrders.length > 0 || tempoMode !== "idle") {
      return;
    }
    const livingIds = new Set(activeParty.map((member) => member.id));
    const replay = remapRepeatOrders(
      lastCombatOrders,
      livingIds,
      livingEnemyGroups.map((group) => group.id)
    );
    if (replay.length === 0) {
      setTempoStatus(t("tempo.repeatRoundUnavailable"));
      return;
    }
    resolveRound(replay);
  }

  function menuQueueAttack(groupId: string) {
    if (selectedActor) {
      queueCombatOrder({ actorId: selectedActor.id, action: "attack", targetGroupId: groupId });
    }
  }

  function menuQueueSpell(spellId: SpellId, groupId: string | null) {
    if (!selectedActor || selectedActor.mp < SPELLS[spellId].mpCost) {
      return;
    }
    if (SPELLS[spellId].target === "ally") {
      const wounded = [...state.party]
        .filter((member) => member.hp > 0)
        .sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp)[0];
      queueCombatOrder({ actorId: selectedActor.id, action: "cast", spellId, targetCharacterId: (wounded ?? selectedActor).id });
    } else if (groupId) {
      queueCombatOrder({ actorId: selectedActor.id, action: "cast", spellId, targetGroupId: groupId });
    }
  }

  function menuQueueDefend() {
    if (selectedActor) {
      queueCombatOrder({ actorId: selectedActor.id, action: "defend" });
    }
  }

  function menuQueueItem(itemId: string, targetCharacterId: string) {
    if (selectedActor) {
      queueCombatOrder({ actorId: selectedActor.id, action: "use_item", itemId, targetCharacterId });
    }
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
    setTempoStep(0);
    setTempoMode(preferredMode);
  }

  function loadDebugProgress() {
    setState(createDebugStateFromProgress(defaultWorld, debugProgress));
    setHeadlessStatus("");
  }

  function runHeadless() {
    // Dense floors need a larger walk budget than the old linear layout, and a
    // deep-floor probe may cross several to reach a town-return anchor.
    const result = runHeadlessClear(state, defaultWorld, 1800);
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
      // Paced (playback) combat rounds are driven by the dedicated effect below so
      // Auto plays out blow-by-blow; the interval only handles dungeon auto-move and
      // instant-mode combat.
      if (!instantCombatLog && stateRef.current.phase === "combat") {
        return;
      }
      const result = runTempoStep(stateRef.current, tempoMode, defaultWorld, t, { safetyStops: autoBattleSafety });
      stateRef.current = result.state;
      setState(result.state);
      setTempoStep((step) => step + 1);

      if (!result.keepRunning) {
        setTempoMode("idle");
        setTempoStatus(result.status);
      }
    }, tempoSpeed === "fast" ? 130 : 320);

    return () => window.clearInterval(timer);
  }, [tempoMode, tempoSpeed, autoBattleSafety, instantCombatLog, t]);

  // Auto-battle, paced: while Auto runs in combat (and playback is on), resolve one
  // round through the playback path, then let the committed state re-trigger the
  // next — so オート plays out blow-by-blow instead of finishing in an instant.
  useEffect(() => {
    if (tempoMode === "idle" || instantCombatLog || state.phase !== "combat" || playback) {
      return;
    }
    const stop = autoCombatStopStatus(state, { safetyStops: autoBattleSafety }, t);
    if (stop) {
      setTempoMode("idle");
      setTempoStatus(stop);
      return;
    }
    const actions = chooseAutoRoundActions(state, defaultWorld);
    if (actions.length === 0) {
      setTempoMode("idle");
      return;
    }
    const timer = window.setTimeout(() => {
      setTempoStep((step) => step + 1);
      resolveRound(actions, { fromAuto: true });
    }, tempoSpeed === "fast" ? 120 : 300);
    return () => window.clearTimeout(timer);
  }, [tempoMode, instantCombatLog, state, playback, autoBattleSafety, tempoSpeed, t]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      // The victory result modal owns the keyboard while up: Enter/Space/Esc dismiss
      // it, everything else is swallowed so the party doesn't move behind it.
      if (combatResult) {
        if (key === "enter" || key === " " || key === "escape") {
          event.preventDefault();
          setCombatResult(null);
        }
        return;
      }
      if (isTypingTarget(event.target)) {
        if (key === "escape" && event.target instanceof HTMLElement) {
          event.preventDefault();
          event.target.blur();
          activateControllerCancel();
        }
        return;
      }

      // The combat command menu owns its navigation keys while focused (↑↓ Enter
      // Space Esc Backspace); skip the global movement/focus shortcuts for those so
      // its own handler runs. Other keys (e.g. R for auto/repeat) still pass through.
      const menuFocused =
        event.target instanceof HTMLElement &&
        Boolean(event.target.closest('[data-controller-surface="combat-menu"]'));
      const menuKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", "enter", " ", "escape", "backspace"];
      if (menuFocused && menuKeys.includes(key)) {
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
        // Left/Right keep the linear focus ring (traverses every control);
        // Up/Down navigate spatially so a card grid moves row-by-row as it looks.
        const handled =
          key === "arrowleft"
            ? moveControllerFocus(-1)
            : key === "arrowright"
              ? moveControllerFocus(1)
              : moveControllerFocusDirection(key === "arrowup" ? "up" : "down");
        if (handled) {
          event.preventDefault();
          return;
        }
      }

      if (key === "escape") {
        event.preventDefault();
        if (activateControllerCancel()) {
          return;
        }
        // Escape closes an open overlay first (full map, camp) before anything else.
        if (fullMapOpen || campOpen) {
          setFullMapOpen(false);
          setCampOpen(false);
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
        run({ type: "strafe_left" });
      } else if (state.phase === "dungeon" && key === "e") {
        event.preventDefault();
        run({ type: "strafe_right" });
      } else if (state.phase === "dungeon" && key === "f") {
        event.preventDefault();
        run({ type: "search" });
      } else if (state.phase === "dungeon" && key === "g") {
        event.preventDefault();
        run({ type: "use_stairs" });
      } else if (state.phase === "dungeon" && key === "m") {
        event.preventDefault();
        setFullMapOpen((open) => !open);
      }
      // Per-actor combat input is owned by the focused command menu (CombatCommandMenu);
      // the round auto-resolves after the last actor, so there are no global combat
      // action shortcuts here. R/Space still toggle auto-battle above.
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [campOpen, combatOrdersReady, combatResult, fullMapOpen, isTempoRunning, selectedActor, selectedTarget, state, t, tempoMode]);

  // Camp and the full-floor map are exploration-only; a fight or a return to
  // town closes them.
  useEffect(() => {
    if (state.phase !== "dungeon") {
      setCampOpen(false);
      setFullMapOpen(false);
    }
  }, [state.phase]);

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
    <main
      className={screen === "game" ? "app-shell" : "app-shell title-shell"}
      data-phase={screen === "game" ? state.phase : undefined}
    >
      {screen !== "game" && (
        <TitleScreen
          screen={screen}
          t={t}
          locale={locale}
          hasAutosave={hasAutosave}
          saveStatus={saveStatus}
          hasCorruptAutosave={hasCorruptAutosave}
          autoBattleSafety={autoBattleSafety}
          onNewGame={startNewGame}
          onContinue={() => loadGame(AUTO_SAVE_SLOT)}
          onToggleConfig={() => setScreen(screen === "config" ? "title" : "config")}
          onChangeLocale={changeLocale}
          onToggleAutoBattleSafety={(enabled) => {
            setAutoBattleSafety(enabled);
            saveAutoBattleSafety(enabled);
          }}
          instantCombatLog={instantCombatLog}
          onToggleInstantCombatLog={(enabled) => {
            setInstantCombatLog(enabled);
            saveInstantCombatLog(enabled);
          }}
          confirmRound={confirmRound}
          onToggleConfirmRound={(enabled) => {
            setConfirmRound(enabled);
            saveConfirmRound(enabled);
          }}
        />
      )}

      {screen === "game" && scenarioValidationErrors.length > 0 ? (
        <ScenarioValidationPanel errors={scenarioValidationErrors} t={t} />
      ) : screen === "game" ? (
        <>
      {debugMode && (
        <DebugPanel
          open={debugPanelOpen}
          onToggle={() => setDebugPanelOpen((open) => !open)}
          visitedCount={state.map.visitedRooms.length}
          roomTotal={getTotalRoomCount()}
          phase={state.phase}
          t={t}
          progress={debugProgress}
          onChangeProgress={(value) => setDebugProgress(parseDebugProgress(value))}
          onLoadProgress={loadDebugProgress}
          onRunHeadless={runHeadless}
          onImportPack={importScenarioPackFiles}
          saveSlotId={saveSlotId}
          onChangeSlot={setSaveSlotId}
          saveSlots={saveSlots}
          onSave={() => saveGame(saveSlotId)}
          onLoad={() => loadGame(saveSlotId, false)}
          headlessStatus={headlessStatus}
          saveStatus={saveStatus}
          scenarioImportStatus={scenarioImportStatus}
        />
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
          {combatResult && (
            <CombatResultPanel result={combatResult} t={t} onDismiss={() => setCombatResult(null)} />
          )}
          <div className="section-title">
            <h2 id="location-heading">{state.phase === "town" ? t("play.town") : state.phase === "combat" ? t("play.combat") : roomText?.name}</h2>
            <div className="scene-meta">
              <span className="scene-facing">
                {state.position && <Compass size={13} aria-hidden="true" />}
                {state.position ? t("play.facing", { direction: t(`direction.${state.position.facing}`) }) : t("play.safe")}
              </span>
              <span className="build-stamp" title="build">{__APP_BUILD__}</span>
            </div>
          </div>

          {state.phase === "town" ? (
            <div className="town-view">
              {townMode !== "entry" && (
                <div className="town-service-bar">
                  <button type="button" className="town-back" onClick={() => enterTownMode("entry")}>
                    <ArrowLeft size={18} />
                    {t("town.backToTown")}
                  </button>
                </div>
              )}
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
                                aria-pressed={draft.classId === classDef.id}
                                onClick={(event) => {
                                  setDraft((current) => ({ ...current, classId: classDef.id }));
                                  // Jump focus to the confirm button so picking a
                                  // class and proceeding is two presses, not a hunt.
                                  event.currentTarget
                                    .closest("section")
                                    ?.querySelector<HTMLButtonElement>("[data-guild-advance]")
                                    ?.focus();
                                }}
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
                            <button type="button" className="primary-action" data-guild-advance="true" onClick={() => setGuildCreationStep("appearance")}>{t("party.next")}</button>
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
                      data-controller-active={
                        state.party.length >= PARTY_SIZE_LIMIT || showGuildFallbackRecruit ? "true" : undefined
                      }
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

                      {state.retired.length > 0 && (
                        <section className="formation-row retired-row" aria-label={t("party.retiredHeading")} data-testid="guild-retired">
                          <h4>{t("party.retiredHeading")} ({state.retired.length})</h4>
                          <div className="formation-slots">
                            {state.retired.map((member) => (
                              <div className="formation-slot" key={member.id}>
                                <div className="party-member retired-member" style={{ borderColor: member.accentColor }}>
                                  <div>
                                    <strong>{member.name}</strong>
                                    <span>{formatCharacterSummary(member, locale, t)}</span>
                                  </div>
                                </div>
                                {state.phase === "town" && eraseConfirmId !== member.id && (
                                  <div className="retired-actions">
                                    <button
                                      type="button"
                                      className="roster-action"
                                      disabled={state.party.length >= PARTY_SIZE_LIMIT}
                                      onClick={() => run({ type: "unretire_member", characterId: member.id })}
                                    >
                                      {t("party.unretire")}
                                    </button>
                                    <button type="button" className="roster-action danger" onClick={() => setEraseConfirmId(member.id)}>
                                      {t("party.erase")}
                                    </button>
                                  </div>
                                )}
                                {state.phase === "town" && eraseConfirmId === member.id && (
                                  <div className="erase-confirm" data-testid="erase-confirm">
                                    <p>{t("party.eraseWarning", { name: member.name })}</p>
                                    <div className="retired-actions">
                                      <button
                                        type="button"
                                        className="roster-action danger"
                                        onClick={() => {
                                          run({ type: "erase_member", characterId: member.id });
                                          setEraseConfirmId(null);
                                        }}
                                      >
                                        {t("party.eraseConfirm")}
                                      </button>
                                      <button type="button" className="roster-action" onClick={() => setEraseConfirmId(null)}>
                                        {t("party.eraseCancel")}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {vault.length > 0 && (
                        <section className="formation-row vault-row" aria-label={t("party.vaultHeading")} data-testid="adventurer-vault">
                          <h4>{t("party.vaultHeading")} ({vault.length})</h4>
                          <p className="vault-hint">{t("party.vaultHint")}</p>
                          <div className="formation-slots">
                            {vault.map((entry) => (
                              <div className="formation-slot" key={entry.vaultId}>
                                <div className="party-member vault-member" style={{ borderColor: entry.adventurer.identity.accentColor }}>
                                  <div>
                                    <strong>{entry.adventurer.identity.name}</strong>
                                    <span>
                                      {findClass(entry.adventurer.build.classId).label[locale]} · Lv{entry.adventurer.progress.level}
                                    </span>
                                    <small>{t("party.vaultOrigin", { world: entry.adventurer.origin.worldTitle })}</small>
                                  </div>
                                </div>
                                {state.phase === "town" && (
                                  <div className="retired-actions">
                                    <button
                                      type="button"
                                      className="roster-action"
                                      onClick={() => run({ type: "import_member", adventurer: entry.adventurer })}
                                    >
                                      {t("party.import")}
                                    </button>
                                    <button
                                      type="button"
                                      className="roster-action danger"
                                      onClick={() => removeVaultEntry(entry.vaultId)}
                                    >
                                      {t("party.vaultRemove")}
                                    </button>
                                  </div>
                                )}
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
                        {state.phase === "town" && (
                          <div className="reclass-control" data-testid="reclass-control">
                            <label>
                              {t("party.reclass")}
                              <select
                                value={reclassClassId}
                                onChange={(event) => setReclassClassId(event.target.value as CharacterClassId | "")}
                              >
                                <option value="">{t("party.reclassPick")}</option>
                                {classCatalog
                                  .filter((classDef) => classDef.id !== selectedProfile.classId)
                                  .map((classDef) => (
                                    <option key={classDef.id} value={classDef.id}>
                                      {classDef.label[locale]}
                                    </option>
                                  ))}
                              </select>
                            </label>
                            <button
                              type="button"
                              className="roster-action"
                              disabled={!reclassClassId}
                              onClick={() => {
                                if (reclassClassId) {
                                  run({ type: "reclass_member", characterId: selectedProfile.id, classId: reclassClassId });
                                  setReclassClassId("");
                                }
                              }}
                            >
                              {t("party.reclassConfirm")}
                            </button>
                            <button
                              type="button"
                              className="roster-action"
                              onClick={() => run({ type: "retire_member", characterId: selectedProfile.id })}
                            >
                              {t("party.retire")}
                            </button>
                            <button
                              type="button"
                              className="roster-action"
                              data-testid="deposit-vault"
                              onClick={() => depositMember(selectedProfile)}
                            >
                              {t("party.deposit")}
                            </button>
                            {editProfileId !== selectedProfile.id && (
                              <button
                                type="button"
                                className="roster-action"
                                onClick={() => {
                                  setEditProfileId(selectedProfile.id);
                                  setEditDraft({
                                    name: selectedProfile.name,
                                    title: selectedProfile.title,
                                    notes: selectedProfile.notes,
                                    accentColor: selectedProfile.accentColor
                                  });
                                }}
                              >
                                {t("party.edit")}
                              </button>
                            )}
                          </div>
                        )}
                        {state.phase === "town" && editProfileId === selectedProfile.id && (
                          <form
                            className="identity-edit"
                            data-testid="identity-edit"
                            onSubmit={(event) => {
                              event.preventDefault();
                              run({ type: "edit_member_identity", characterId: selectedProfile.id, ...editDraft });
                              setEditProfileId(null);
                            }}
                          >
                            <label>
                              {t("party.editName")}
                              <input value={editDraft.name} onChange={(event) => setEditDraft((draft) => ({ ...draft, name: event.target.value }))} />
                            </label>
                            <label>
                              {t("party.editTitle")}
                              <input value={editDraft.title} onChange={(event) => setEditDraft((draft) => ({ ...draft, title: event.target.value }))} />
                            </label>
                            <label>
                              {t("party.editNotes")}
                              <textarea value={editDraft.notes} onChange={(event) => setEditDraft((draft) => ({ ...draft, notes: event.target.value }))} />
                            </label>
                            <label>
                              {t("party.editAccent")}
                              <input type="color" value={editDraft.accentColor} onChange={(event) => setEditDraft((draft) => ({ ...draft, accentColor: event.target.value }))} />
                            </label>
                            <div className="retired-actions">
                              <button type="submit" className="roster-action" disabled={!editDraft.name.trim()}>
                                {t("party.editSave")}
                              </button>
                              <button type="button" className="roster-action" onClick={() => setEditProfileId(null)}>
                                {t("party.editCancel")}
                              </button>
                            </div>
                          </form>
                        )}
                      </article>
                      )}
                    </section>
                  </div>
                </section>
              )}
              {townMode === "entry" && (
                <TownEntryPanel
                  t={t}
                  world={defaultWorld}
                  locale={locale}
                  partyGold={state.partyGold}
                  partyEmpty={state.party.length === 0}
                  latestLogText={latestLogText}
                  injuredMembers={injuredMembers}
                  carriedLootCount={carriedLootCount}
                  carriedLootSummary={carriedLootSummary}
                  recoveryCost={recoveryCost}
                  hasEquipmentLoot={state.inventory.some((item) => item.kind === "equipment")}
                  unlockedCheckpoints={unlockedCheckpoints}
                  onCommand={run}
                  onEnterMode={enterTownMode}
                />
              )}
              {townMode === "recovery" && (
                <RecoveryPanel
                  t={t}
                  party={state.party}
                  partyGold={state.partyGold}
                  recoveryCost={recoveryCost}
                  latestLogText={latestLogText}
                  latestEventType={latestEventType ?? null}
                  injuredCount={injuredMembers.length}
                  onRecover={() => run({ type: "recover_party" })}
                />
              )}
              {townMode === "shop" && townShop && (
                <ShopPanel
                  t={t}
                  locale={locale}
                  world={defaultWorld}
                  shop={townShop}
                  partyGold={state.partyGold}
                  party={state.party}
                  inventory={state.inventory}
                  latestLogText={latestLogText}
                  latestEventType={latestEventType ?? null}
                  selectedProfile={selectedProfile}
                  onSelectProfile={setSelectedProfileId}
                  availableShopCategories={availableShopCategories}
                  activeShopCategory={activeShopCategory}
                  onSetCategory={setShopCategory}
                  onCommand={run}
                />
              )}
              {townMode === "records" && (
                <RecordsPanel t={t} log={state.log} locale={locale} world={defaultWorld} />
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
            <div
              className={`adventure-cockpit ${state.phase === "combat" ? "combat-cockpit" : "dungeon-cockpit"}`}
              aria-label={state.phase === "combat" ? t("play.battleScreen") : undefined}
            >
              {state.phase === "dungeon" ? (
                <>
                  <div className="cockpit-scene">
                    <DungeonView state={state} world={defaultWorld} label={t("play.dungeonView")} />
                  </div>
                  <aside className="cockpit-rail" aria-label={t("play.partyStatus")}>
                    <div className="navigation-board" aria-label={t("map.heading")}>
                      <MapPanel state={state} world={defaultWorld} locale={locale} t={t} debugMode={debugMode} />
                    </div>
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
                                  <span>HP {member.hp}/{stats.maxHp}</span>
                                  {stats.maxMp > 0 && <span>{t("play.mpShort")} {member.mp}/{stats.maxMp}</span>}
                                  <span className="party-token-detail">{t("party.damage")} {stats.damageMin}-{stats.damageMax}</span>
                                  <span className="party-token-detail">{t("party.armor")} {stats.armor}</span>
                                  <span className="party-token-detail">{t("party.speed")} {stats.speed}</span>
                                </div>
                                <div className="party-token-gauges">
                                  <div
                                    className={`stat-gauge hp-gauge${member.hp <= Math.ceil(member.maxHp * 0.35) ? " danger" : ""}`}
                                    role="meter"
                                    aria-valuenow={member.hp}
                                    aria-valuemax={member.maxHp}
                                    aria-label={`${member.name} HP`}
                                  >
                                    <span className="stat-gauge-fill" style={{ width: `${Math.max(0, (member.hp / member.maxHp) * 100)}%` }} />
                                  </div>
                                  {member.maxMp > 0 && (
                                    <div
                                      className="stat-gauge mp-gauge"
                                      data-testid="party-mp-gauge"
                                      role="meter"
                                      aria-valuenow={member.mp}
                                      aria-valuemax={member.maxMp}
                                      aria-label={`${member.name} MP`}
                                    >
                                      <span className="stat-gauge-fill" style={{ width: `${Math.max(0, (member.mp / member.maxMp) * 100)}%` }} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                  </aside>
                </>
              ) : (
                <>
                  <CombatEnemyStage
                    backdrop={<DungeonView state={state} world={defaultWorld} label={t("play.dungeonView")} />}
                    groups={displayedEnemyGroups}
                    selectedTargetId={selectedTarget?.id}
                    targetingActive={!playback}
                    activeBeat={activeBeat}
                    beatKey={playback?.index}
                    locale={locale}
                    t={t}
                    caption={`${t("play.round", { round: state.combat?.round ?? 1 })} · ${
                      selectedActor && selectedTarget
                        ? t("play.selectedOrder", { actor: selectedActor.name, target: localizedEnemyGroupName(selectedTarget, locale) })
                        : combatOrdersReady
                          ? t("play.orderReady")
                          : t("play.selectOrder")
                    }`}
                  />
                  <CombatPartyStrip
                    members={displayedParty.map((member) => ({
                      ...member,
                      maxHp: getEffectiveCharacterStats(member, defaultWorld).maxHp,
                      maxMp: getEffectiveCharacterStats(member, defaultWorld).maxMp
                    }))}
                    selectedActorId={playback ? undefined : selectedActor?.id}
                    orderedActorIds={orderedActorIds}
                    activeBeat={activeBeat}
                    beatKey={playback?.index}
                    t={t}
                  />
                </>
              )}

              {state.phase === "dungeon" ? (
                <div className="cockpit-message">
                  <p className="room-copy">{roomText?.description}</p>
                  <p className="event-window" aria-live="polite">{tempoStatus || latestLogText || "\u00a0"}</p>
                </div>
              ) : (
                <div className="cockpit-message combat-message">
                  {tempoStatus && <p className="event-window" aria-live="polite">{tempoStatus}</p>}
                  <CombatLog
                    t={t}
                    beats={(playback ? playback.beats : combatBeats).map(formatBeatLine)}
                    revealed={playback ? playback.index + 1 : revealedBeats}
                    onAdvance={playback ? commitPlayback : () => setRevealedBeats(combatBeats.length)}
                  />
                  <span className="combat-order-progress" data-testid="combat-order-list">
                    {t("play.orderProgress", { ready: combatOrders.length, total: activeParty.length })}
                  </span>
                </div>
              )}
              {tempoMode !== "idle" && (
                <TempoIndicator
                  mode={tempoMode}
                  step={tempoStep}
                  speed={tempoSpeed}
                  t={t}
                  onToggleSpeed={() => setTempoSpeed((current) => (current === "fast" ? "normal" : "fast"))}
                  onStop={() => toggleTempoMode()}
                />
              )}
              {state.phase === "combat" ? (
                <>
                  {selectedActor && !playback && (
                    <CombatCommandMenu
                      actor={selectedActor}
                      livingGroups={livingEnemyGroups}
                      spells={knownSpells(selectedActor.classId, selectedActor.level)}
                      abilityKind={isCasterClass(selectedActor.classId) ? "spell" : "skill"}
                      localizeGroup={(group) => localizedEnemyGroupName(group, locale)}
                      canAttack={
                        livingEnemyGroups.length > 0 &&
                        !(selectedActor.row === "back" && frontRowStanding && !weaponReaches(selectedActor, defaultWorld))
                      }
                      consumables={combatConsumables}
                      partyTargets={activeParty.map((member) => ({ id: member.id, name: member.name }))}
                      t={t}
                      onQueueAttack={menuQueueAttack}
                      onQueueSpell={menuQueueSpell}
                      onQueueDefend={menuQueueDefend}
                      onQueueItem={menuQueueItem}
                      onUndo={takeBackCombatOrder}
                    />
                  )}
                  {combatOrdersReady && confirmRound && !playback && (
                    <div
                      className="combat-command-menu combat-confirm"
                      data-testid="combat-confirm-round"
                      data-controller-active="true"
                      data-controller-surface="combat-menu"
                      onKeyDown={(event) => {
                        const key = event.key.toLowerCase();
                        if (key === "escape" || key === "backspace" || key === "a") {
                          event.preventDefault();
                          takeBackCombatOrder();
                        }
                      }}
                    >
                      <p className="combat-command-menu-head">{t("play.confirmRoundPrompt")}</p>
                      <button
                        type="button"
                        className="combat-confirm-button"
                        data-testid="combat-confirm-execute"
                        ref={(node) => node?.focus()}
                        onClick={executeCombatOrders}
                      >
                        {t("play.executeRound")}
                        <kbd className="key-hint">Enter</kbd>
                      </button>
                      <p className="combat-command-menu-hint">{t("play.confirmRoundHint")}</p>
                    </div>
                  )}
                  <CombatCommandDock
                    t={t}
                    isTempoRunning={isTempoRunning}
                    onToggleTempo={() => toggleTempoMode("combat")}
                    onRepeatRound={repeatLastRound}
                    canRepeat={lastCombatOrders.length > 0 && !isTempoRunning && combatOrders.length === 0}
                    onRetreat={() => run({ type: "retreat" })}
                    debugMode={debugMode}
                    onForceVictory={() => run({ type: "debug_force_victory" })}
                    onReviveParty={() => run({ type: "debug_revive_party" })}
                  />
                </>
              ) : (
                <DungeonCommandDock
                  t={t}
                  onCommand={run}
                  isTempoRunning={isTempoRunning}
                  onToggleTempo={() => toggleTempoMode("dungeon")}
                  onOpenCamp={() => setCampOpen(true)}
                  onOpenFullMap={() => setFullMapOpen(true)}
                  debugMode={debugMode}
                  onAutoExplore={() => setState((current) => debugAutoExplore(current, defaultWorld))}
                  canUseStairs={canUseStairs}
                  blockingStairGate={Boolean(blockingStairGate)}
                  stairGateClue={stairGateClue ?? null}
                  onUseStairs={() => run({ type: "use_stairs" })}
                  canReturnToTown={canReturnToTown}
                  returnViaStairs={currentRoom?.returnStyle === "stairs"}
                  onReturnToTown={() => run({ type: "return_to_town" })}
                  showEscapeItem={Boolean(canUseEscapeItem && escapeItem)}
                  onUseEscapeItem={() =>
                    escapeItem &&
                    run({ type: "use_item", itemId: escapeItem.id, targetCharacterId: state.party[0]?.id ?? "" })
                  }
                />
              )}
            </div>
          )}
        </section>
      </section>
        {campOpen && state.phase === "dungeon" && (
          <CampPanel
            party={state.party}
            inventory={state.inventory}
            t={t}
            onCommand={run}
            onClose={() => setCampOpen(false)}
          />
        )}
        {fullMapOpen && state.phase === "dungeon" && (
          <FloorMapOverlay state={state} world={defaultWorld} locale={locale} t={t} onClose={() => setFullMapOpen(false)} />
        )}
        </>
      ) : null}
    </main>
  );
}

function isDebugModeEnabled() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";
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
  const portraitAssetUrl = portraitUrl(background.portraitKey);
  if (portraitAssetUrl) {
    return <img data-testid={testId} src={portraitAssetUrl} alt={alt || background.label.en} />;
  }

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

function getDebugProgressFromLocation() {
  if (typeof window === "undefined") {
    return "ready";
  }

  return parseDebugProgress(new URLSearchParams(window.location.search).get("progress"));
}

// Seed a debug state, then honor an optional `&at=<roomId>&facing=<dir>` override
// so mechanic e2es can start on the exact cell under test (see withDebugStartCell).
function createDebugStateFromLocation(): GameState {
  const state = createDebugStateFromProgress(defaultWorld, getDebugProgressFromLocation());
  if (typeof window === "undefined") {
    return state;
  }
  const params = new URLSearchParams(window.location.search);
  const at = params.get("at");
  if (!at) {
    return state;
  }
  const facing = params.get("facing") as Direction | null;
  return withDebugStartCell(state, defaultWorld, at, facing ?? undefined);
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
