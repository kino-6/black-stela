import { useEffect, useMemo, useRef, useState } from "react";
import {
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
  analyzePartyCoverage,
  backgroundCatalog,
  classCatalog,
  createGuildCharacter,
  createQuickRecruit,
  createStarterParty,
  findBackground,
  findClass,
  findTrait,
  PARTY_SIZE_LIMIT,
  starterTemplates,
  traitCatalog,
  type StarterTemplateId
} from "./domain/characterCreation";
import { getLocalizedRoomText, getRoom } from "./domain/scenario";
import { executeCommand } from "./domain/rulesEngine";
import { projectEventToLog } from "./domain/replayLog";
import { calculateRecoveryCost, getEffectiveCharacterStats, isEquipmentUsableBy } from "./domain/economy";
import type {
  CharacterAptitudes,
  CombatActionDeclaration,
  CombatActionKind,
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
  classId: "vanguard" | "seeker" | "mender" | "occultist";
  backgroundId: "watch" | "ruinborn" | "apothecary" | "debtor" | "cartographer";
  traitId: "steady" | "scarred" | "lucky" | "grim" | "curious";
  aptitudeFocus: "balanced" | "might" | "agility" | "spirit" | "wit" | "luck";
  bonusPool: number;
  bonusAptitude: CharacterAptitudes;
  bonusSeed: number;
  accentColor: string;
  portraitRef?: string;
}

type GuildCreationStep = "briefing" | "class" | "appearance" | "bonus" | "name";
type TownMode = "guild" | "shop" | "recovery" | "records" | "entry";
type AppScreen = "title" | "config" | "game";
type TempoMode = "idle" | "dungeon" | "combat";

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
  const [combatOrders, setCombatOrders] = useState<CombatActionDeclaration[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
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
  const canReturnToTown = Boolean(currentRoom?.stairsToTown);

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
  const combatOrdersReady = state.phase === "combat" && activeParty.length > 0 && activeParty.every((member) => orderedActorIds.has(member.id));
  const combatHealingItem = state.inventory.find((item) => item.kind === "healing" && item.quantity > 0);
  const showGuildPanel = false;
  const isTempoRunning = tempoMode !== "idle";
  const partyCoverage = useMemo(() => analyzePartyCoverage(state.party), [state.party]);
  const recoveryCost = useMemo(() => calculateRecoveryCost(state.party), [state.party]);
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
  const allocatedBonusPoints = useMemo(() => getAllocatedBonusPoints(draft.bonusAptitude), [draft.bonusAptitude]);
  const remainingBonusPoints = draft.bonusPool - allocatedBonusPoints;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
    const result = runHeadlessClear(state, defaultWorld);
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
    setState((current) => addCharacter(current, character));
    setSelectedProfileId(character.id);
    setDraft(createFreshDraft({ classId: draft.classId, backgroundId: draft.backgroundId, traitId: draft.traitId }));
    setGuildCreationStep("class");
  }

  function addQuickRecruit() {
    const current = stateRef.current;
    const character = createQuickRecruit(`quick:${current.turn}:${current.party.length}`, current.turn);
    setState((latest) => addCharacter(latest, character));
    setSelectedProfileId(character.id);
  }

  function applyStarterTemplate(templateId: StarterTemplateId) {
    const partyTurn = stateRef.current.turn;
    const party = createStarterParty(templateId, partyTurn);
    setState((current) => {
      const emptiedState: GameState = { ...current, party: [] };
      return party.reduce<GameState>((next, character) => addCharacter(next, character), emptiedState);
    });
    setSelectedProfileId(party[0]?.id ?? null);
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
      const result = runTempoStep(stateRef.current, tempoMode, t);
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
      if (isTypingTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "escape") {
        event.preventDefault();
        if (tempoMode !== "idle") {
          setTempoMode("idle");
          setTempoStatus(t("tempo.repeatStopped"));
        }
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
        run({ type: "search" });
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
          <nav className="title-menu" aria-label={t("title.menu")}>
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
            <section className="title-config" aria-labelledby="title-config-heading">
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

          <div className="guild-actions" aria-label={t("party.quickActions")}>
            <button type="button" onClick={addQuickRecruit} disabled={state.party.length >= PARTY_SIZE_LIMIT}>
              {t("party.quickRecruit")}
            </button>
            <div className="template-row" aria-label={t("party.templates")}>
              {(Object.keys(starterTemplates) as StarterTemplateId[]).map((templateId) => (
                <button type="button" key={templateId} onClick={() => applyStarterTemplate(templateId)}>
                  {starterTemplates[templateId].label[locale]}
                </button>
              ))}
            </div>
          </div>

          <section className="coverage-panel" aria-label={t("party.coverage")}>
            <h3>{t("party.coverage")}</h3>
            <ul>
              {partyCoverage.map((item) => (
                <li className={`coverage-${item.status}`} key={item.id}>
                  <span>{t(`coverage.${item.id}` as Parameters<Translator>[0])}</span>
                  <strong>{t(`coverage.${item.status}` as Parameters<Translator>[0])}</strong>
                </li>
              ))}
            </ul>
          </section>

          <div className="roster" aria-live="polite">
            {state.party.length === 0 ? (
              <p className="empty-state">{t("party.empty")}</p>
            ) : (
              state.party.map((member) => (
                <article className="party-member" key={member.id} style={{ borderColor: member.accentColor }}>
                  <div className="portrait">
                    {member.portraitRef && !member.portraitRef.startsWith("debug://") ? (
                      <img src={member.portraitRef} alt="" />
                    ) : (
                      <span>{member.name.slice(0, 1)}</span>
                    )}
                  </div>
                  <div>
                    <h3>{member.name}</h3>
                    <p>
                      {member.title} / {findClass(member.classId).label[locale]} / {findBackground(member.backgroundId).label[locale]}
                    </p>
                    <small>{member.traitIds.map((traitId) => findTrait(traitId).label[locale]).join(" · ")}</small>
                    <small>
                      {t("party.hpAtk", { hp: member.hp, maxHp: member.maxHp, attack: member.attack })}
                    </small>
                    <small>{member.startingEquipment.join(" / ")}</small>
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
                    onChange={(event) => setDraft((current) => ({ ...current, backgroundId: event.target.value as CharacterDraft["backgroundId"] }))}
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
              <div className="accent-row" aria-label={t("party.accent")}>
                {["#c9a765", "#8ea87a", "#b66f4d", "#7a9bbd", "#a784b8"].map((color) => (
                  <button
                    type="button"
                    className={draft.accentColor === color ? "selected" : ""}
                    key={color}
                    aria-label={color}
                    onClick={() => setDraft((current) => ({ ...current, accentColor: color }))}
                    style={{ backgroundColor: color }}
                  />
                ))}
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
              {draft.portraitRef && <img className="portrait-preview" src={draft.portraitRef} alt={t("party.portraitPreview")} />}
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
              <div className="town-mode-tabs" aria-label="Town modes">
                <button type="button" onClick={() => setTownMode("guild")}>{t("town.guild")}</button>
                <button type="button" onClick={() => setTownMode("shop")}>{t("town.shop")}</button>
                <button type="button" onClick={() => setTownMode("recovery")}>{t("town.recovery")}</button>
                <button type="button" onClick={() => setTownMode("records")}>{t("town.records")}</button>
                <button type="button" onClick={() => setTownMode("entry")}>{t("town.entry")}</button>
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
                      <section className="guild-ready-panel" aria-label={t("party.partyReadyHeading")}>
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
                        <section className="guild-step-panel" data-testid="guild-step-briefing">
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
                        <section className="guild-step-panel" data-testid="guild-step-class">
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
                                <small>{formatRoleTags(classDef.roleTags, t)}</small>
                              </button>
                            ))}
                          </div>
                          <div className="flow-actions">
                            <button type="button" onClick={() => setGuildCreationStep("briefing")}>{t("party.back")}</button>
                            <button type="button" className="primary-action" onClick={() => setGuildCreationStep("appearance")}>{t("party.next")}</button>
                          </div>
                        </section>
                      )}

                      {guildCreationStep === "appearance" && (
                        <section className="guild-step-panel" data-testid="guild-step-appearance">
                          <h4>{t("party.chooseAppearance")}</h4>
                          <div className="creator-topline">
                            <div className="portrait portrait-large" style={{ borderColor: draft.accentColor }}>
                              {draft.portraitRef ? (
                                <img data-testid="portrait-preview" src={draft.portraitRef} alt={t("party.portraitPreview")} />
                              ) : (
                                <span>{(draft.name || findClass(draft.classId).label[locale]).slice(0, 1)}</span>
                              )}
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
                                onChange={(event) => setDraft((current) => ({ ...current, backgroundId: event.target.value as CharacterDraft["backgroundId"] }))}
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
                          <div className="accent-row" aria-label={t("party.accent")}>
                            {["#c9a765", "#8ea87a", "#b66f4d", "#7a9bbd", "#a784b8"].map((color) => (
                              <button
                                type="button"
                                className={draft.accentColor === color ? "selected" : ""}
                                key={color}
                                aria-label={color}
                                onClick={() => setDraft((current) => ({ ...current, accentColor: color }))}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="flow-actions">
                            <button type="button" onClick={() => setGuildCreationStep("class")}>{t("party.back")}</button>
                            <button type="button" className="primary-action" onClick={() => setGuildCreationStep("bonus")}>{t("party.next")}</button>
                          </div>
                        </section>
                      )}

                      {guildCreationStep === "bonus" && (
                        <section className="guild-step-panel" data-testid="guild-step-bonus">
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
                                <strong>{draft.bonusAptitude[key]}</strong>
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
                            <button type="button" onClick={() => setGuildCreationStep("appearance")}>{t("party.back")}</button>
                            <button type="button" className="primary-action" disabled={remainingBonusPoints > 0} onClick={() => setGuildCreationStep("name")}>{t("party.next")}</button>
                          </div>
                        </section>
                      )}

                      {guildCreationStep === "name" && (
                        <section className="guild-step-panel" data-testid="guild-step-name">
                          <h4>{t("party.nameAdventurer")}</h4>
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
                            <button type="button" onClick={() => setGuildCreationStep("bonus")}>{t("party.back")}</button>
                            <button type="submit" className="primary-action" disabled={state.party.length >= PARTY_SIZE_LIMIT || remainingBonusPoints > 0}>
                              {t("party.add")}
                            </button>
                          </div>
                        </section>
                      )}
                      </form>
                    )}

                    <section className="studio-roster" aria-label={t("party.heading")}>
                      {state.party.length < PARTY_SIZE_LIMIT && (
                        <div className="guild-actions" aria-label={t("party.quickActions")}>
                          <button type="button" onClick={addQuickRecruit}>
                            {t("party.quickRecruit")}
                          </button>
                          <div className="template-row" aria-label={t("party.templates")}>
                            {(Object.keys(starterTemplates) as StarterTemplateId[]).map((templateId) => (
                              <button type="button" key={templateId} onClick={() => applyStarterTemplate(templateId)}>
                                {starterTemplates[templateId].label[locale]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <section className="coverage-panel" aria-label={t("party.coverage")}>
                        <h3>{t("party.coverage")}</h3>
                        <ul>
                          {partyCoverage.map((item) => (
                            <li className={`coverage-${item.status}`} key={item.id}>
                              <span>{t(`coverage.${item.id}` as Parameters<Translator>[0])}</span>
                              <strong>{t(`coverage.${item.status}` as Parameters<Translator>[0])}</strong>
                            </li>
                          ))}
                        </ul>
                      </section>

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

                      <div className="roster roster-compact" aria-live="polite">
                        {state.party.length === 0 ? (
                          <p className="empty-state">{t("party.empty")}</p>
                        ) : (
                          state.party.map((member) => (
                            <button
                              type="button"
                              className={member.id === selectedProfile.id ? "party-member selected" : "party-member"}
                              key={member.id}
                              style={{ borderColor: member.accentColor }}
                              onClick={() => setSelectedProfileId(member.id)}
                            >
                              <div className="portrait">
                                {member.portraitRef && !member.portraitRef.startsWith("debug://") ? (
                                  <img src={member.portraitRef} alt="" />
                                ) : (
                                  <span>{member.name.slice(0, 1)}</span>
                                )}
                              </div>
                              <div>
                                <strong>{member.name}</strong>
                                <span>{formatCharacterTitle(member.title, member.classId, locale)} / {findClass(member.classId).label[locale]}</span>
                                <small>{t("party.hpAtk", { hp: member.hp, maxHp: member.maxHp, attack: member.attack })}</small>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {state.party.length > 0 && (
                      <article className="character-profile" data-testid="character-profile" aria-label={t("party.profile")}>
                        <div className="profile-heading">
                          <div className="portrait portrait-large" style={{ borderColor: selectedProfile.accentColor }}>
                            {selectedProfile.portraitRef && !selectedProfile.portraitRef.startsWith("debug://") ? (
                              <img data-testid="profile-portrait" src={selectedProfile.portraitRef} alt="" />
                            ) : (
                              <span>{selectedProfile.name.slice(0, 1)}</span>
                            )}
                          </div>
                          <div>
                            <h4>{selectedProfile.name}</h4>
                            <p>{formatCharacterTitle(selectedProfile.title, selectedProfile.classId, locale)} / {findClass(selectedProfile.classId).label[locale]} / {findBackground(selectedProfile.backgroundId).label[locale]}</p>
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
                          <div><dt>{t("party.equipment")}</dt><dd>{selectedProfile.startingEquipment.join(" / ")}</dd></div>
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
                <div className="town-scene" aria-hidden="true">
                <div className="town-skyline" />
                <div className="town-gate">
                  <span className="town-lantern left" />
                  <span className="town-stela" />
                  <span className="town-lantern right" />
                </div>
                <div className="town-steps" />
              </div>
              )}
              {townMode === "recovery" && (
                <section className="town-service" aria-labelledby="recovery-heading">
                  <h3 id="recovery-heading">{t("town.recoveryHeading")}</h3>
                  <p className="town-ledger">
                    <strong>{t("town.gold", { gold: state.partyGold })}</strong>
                    <span>{t("town.recoveryCost", { gold: recoveryCost })}</span>
                  </p>
                  <ul>
                    {state.party.map((member) => (
                      <li key={member.id}>{member.name}: {member.hp}/{member.maxHp}{member.injury ? ` · ${member.injury}` : ""}</li>
                    ))}
                  </ul>
                  <button type="button" disabled={state.partyGold < recoveryCost} onClick={() => run({ type: "recover_party" })}>{t("town.recoverParty")}</button>
                </section>
              )}
              {townMode === "shop" && townShop && (
                <section className="town-service shop-service" aria-labelledby="shop-heading">
                  <div className="service-heading">
                    <h3 id="shop-heading">{localizedShopName(townShop, locale)}</h3>
                    <strong>{t("town.gold", { gold: state.partyGold })}</strong>
                  </div>
                  {latestLogText && <p className="event-window" aria-live="polite">{latestLogText}</p>}
                  <div className="shop-grid">
                    <section aria-label={t("town.shopStock")}>
                      <h4>{t("town.shopStock")}</h4>
                      <div className="shop-list">
                        {townShop.stock?.map((stock) => {
                          const equipment = findEquipmentById(stock.itemId);
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
                                {equipment && <small>{t("town.price", { gold: stock.price })}</small>}
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
                    {state.party.map((member) => (
                      <article className="equipment-row" key={member.id}>
                        <div>
                          <strong>{member.name}</strong>
                          <span>
                            {t("town.equipmentSummary", {
                              attack: getEffectiveCharacterStats(member, defaultWorld).damageMax,
                              accuracy: getEffectiveCharacterStats(member, defaultWorld).accuracy,
                              armorValue: getEffectiveCharacterStats(member, defaultWorld).armor,
                              speed: getEffectiveCharacterStats(member, defaultWorld).speed
                            })}
                          </span>
                          <dl className="equipment-slots">
                            {equipmentSlotOrder.map((slot) => (
                              <div key={`${member.id}:${slot}`}>
                                <dt>{formatEquipmentSlot(slot, t)}</dt>
                                <dd>{equippedName(member.equipment[slot], locale)}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                        <div className="equipment-actions">
                          {state.inventory.filter((item) => item.kind === "equipment").map((item) => {
                            const equipment = findEquipmentById(item.id);
                            const usable = equipment ? isEquipmentUsableBy(equipment, member) : false;
                            return (
                              <button
                                type="button"
                                key={`${member.id}:${item.id}`}
                                aria-label={`${t("town.equip")} ${localizedCatalogName(item.id, locale)} to ${member.name}`}
                                disabled={!usable}
                                onClick={() => run({ type: "equip_item", characterId: member.id, equipmentId: item.id })}
                              >
                                {localizedCatalogName(item.id, locale)}
                                <small>{usable ? t("town.allowed") : t("town.ineligible")}</small>
                              </button>
                            );
                          })}
                        </div>
                      </article>
                    ))}
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
              {townMode !== "guild" && townMode !== "shop" && (
                <>
                  <p>
                    {t("play.townCopy")}
                  </p>
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
                </>
              )}
            </div>
          ) : (
            <div className={`adventure-cockpit ${state.phase === "combat" ? "combat-cockpit" : "dungeon-cockpit"}`}>
              <div className="scene-deck">
                <DungeonView state={state} world={defaultWorld} label={t("play.dungeonView")} />
                <aside className="navigation-board" aria-label={t("map.heading")}>
                  <MapPanel state={state} world={defaultWorld} locale={locale} t={t} />
                </aside>
              </div>

              {state.phase === "dungeon" && (
                <div className="party-hud" data-testid="party-hud" aria-label={t("play.partyStatus")}>
                  {(["front", "back"] as const).map((row) => (
                    <div className="party-row-strip" data-testid={`party-${row}-row`} key={row}>
                      <span>{row === "front" ? t("play.frontRow") : t("play.backRow")}</span>
                      <div className="party-row-slots">
                        {state.party.filter((member) => member.row === row).map((member) => (
                          <div
                            className={`party-token ${member.row} ${
                              member.injury || member.hp <= 0
                                ? "down"
                                : member.hp <= Math.ceil(member.maxHp * 0.35)
                                  ? "danger"
                                  : ""
                            }`}
                            key={member.id}
                            style={{ borderColor: member.accentColor }}
                          >
                            <strong>{member.name}</strong>
                            <span>{member.hp}/{member.maxHp}</span>
                          </div>
                        ))}
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
                        <button
                          type="button"
                          key={group.id}
                          className={group.id === selectedTarget?.id ? "battle-choice selected" : "battle-choice"}
                          data-testid="combat-enemy-group"
                          onClick={() => setSelectedTargetId(group.id)}
                        >
                          <strong>{localizedEnemyGroupName(group, locale)}</strong>
                          <span>{t("play.enemyGroupStatus", { count: group.count, hp: group.hpEach })}</span>
                        </button>
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

                  <div className="command-bar command-dock" aria-label={t("play.combatCommands")} data-testid="combat-command-window">
                    <button type="button" aria-pressed={isTempoRunning} onClick={() => toggleTempoMode("combat")}>
                      {isTempoRunning ? <Square size={18} /> : <Repeat2 size={18} />}
                      {isTempoRunning ? t("tempo.stop") : t("tempo.repeat")}
                    </button>
                    <button type="button" disabled={!canSelectedActorAttack} onClick={() => queueSelectedCombatAction("attack")}>
                      <Sword size={18} />
                      {t("play.attack")}
                    </button>
                    <button type="button" disabled={!selectedActor} onClick={() => queueSelectedCombatAction("defend")}>
                      <ShieldCheck size={18} />
                      {t("play.defend")}
                    </button>
                    <button type="button" disabled={!selectedActor || !selectedTarget} onClick={() => queueSelectedCombatAction("cast")}>
                      <ShieldCheck size={18} />
                      {t("play.sleep")}
                    </button>
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
                    <button type="button" disabled={combatOrders.length === 0} onClick={takeBackCombatOrder}>
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
                <div className="command-bar command-dock" aria-label={t("play.dungeonCommands")} data-testid="dungeon-command-window">
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
                  {canReturnToTown && (
                    <button type="button" className="context-command" onClick={() => run({ type: "return_to_town" })}>
                      <LogOut size={18} />
                      {t("play.useReturnMarker")}
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
  return {
    ...defaultDraft,
    bonusSeed: seed,
    bonusPool: rollBonusPool(seed),
    bonusAptitude: createEmptyBonusAptitude(),
    ...overrides
  };
}

function createEmptyBonusAptitude(): CharacterAptitudes {
  return { might: 0, agility: 0, spirit: 0, wit: 0, luck: 0 };
}

function rollBonusPool(seed: number) {
  return 4 + (Math.floor(Math.abs(Math.sin(seed * 12.9898) * 10_000)) % 5);
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

function formatPhase(phase: GameState["phase"], t: Translator) {
  if (phase === "town") {
    return t("play.town");
  }

  if (phase === "combat") {
    return t("play.combat");
  }

  return t("play.dungeon");
}

function formatCombatRow(row: GameState["party"][number]["row"], t: Translator) {
  return row === "front" ? t("play.frontRow") : t("play.backRow");
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

function formatRoleTags(roleTags: string[], t: Translator) {
  return roleTags.map((tag) => t(`coverage.${tag}` as Parameters<Translator>[0])).join(" / ");
}

function formatCharacterTitle(title: string, classId: GameState["party"][number]["classId"], locale: Locale) {
  const classDef = findClass(classId);
  return title === classDef.label.en ? classDef.label[locale] : title;
}

function formatCharacterNotes(notes: string, backgroundId: GameState["party"][number]["backgroundId"], locale: Locale) {
  const background = findBackground(backgroundId);
  return notes === background.notes.en ? background.notes[locale] : notes;
}

function localizedShopName(shop: (typeof defaultWorld.shops)[number], locale: Locale) {
  return shop.locales?.[locale]?.name ?? shop.name;
}

function localizedCatalogName(itemId: string | undefined, locale: Locale) {
  if (!itemId) {
    return "-";
  }

  const item = defaultWorld.items.find((candidate) => candidate.id === itemId);
  if (item) {
    return item.locales?.[locale]?.name ?? item.name;
  }

  const equipment = defaultWorld.equipment.find((candidate) => candidate.id === itemId);
  return equipment?.locales?.[locale]?.name ?? equipment?.name ?? itemId;
}

function localizedCatalogDescription(itemId: string | undefined, locale: Locale) {
  if (!itemId) {
    return "";
  }

  const item = defaultWorld.items.find((candidate) => candidate.id === itemId);
  if (item) {
    return item.locales?.[locale]?.description ?? "";
  }

  const equipment = findEquipmentById(itemId);
  return equipment?.locales?.[locale]?.description ?? equipment?.description ?? "";
}

function equippedName(itemId: string | undefined, locale: Locale) {
  return itemId ? localizedCatalogName(itemId, locale) : "-";
}

function localizedEnemyGroupName(group: { enemyId: string; name: string }, locale: Locale) {
  const enemy = defaultWorld.enemies.find((candidate) => candidate.id === group.enemyId);
  return enemy?.locales?.[locale]?.name ?? enemy?.name ?? group.name;
}

function findEquipmentById(itemId: string | undefined) {
  return defaultWorld.equipment.find((candidate) => candidate.id === itemId);
}

function formatEquipmentSlot(slot: EquipmentSlot, t: Translator) {
  return t(`town.slots.${slot}` as Parameters<Translator>[0]);
}

function formatEquipmentEffect(equipment: ScenarioEquipment, t: Translator) {
  return formatBonusParts(
    equipment.attackBonus,
    equipment.defenseBonus,
    equipment.accuracyBonus,
    equipment.speedBonus,
    t
  );
}

function formatInventoryEffect(item: InventoryItem, t: Translator) {
  return formatBonusParts(item.attackBonus, item.defenseBonus, item.accuracyBonus, item.speedBonus, t);
}

function formatBonusParts(
  attackBonus: number | undefined,
  defenseBonus: number | undefined,
  accuracyBonus: number | undefined,
  speedBonus: number | undefined,
  t: Translator
) {
  const parts = [
    formatSignedBonus(t("town.effectAttack"), attackBonus),
    formatSignedBonus(t("town.effectDefense"), defenseBonus),
    formatSignedBonus(t("town.effectAccuracy"), accuracyBonus),
    formatSignedBonus(t("town.effectSpeed"), speedBonus)
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : t("aptitude.balanced");
}

function formatSignedBonus(label: string, value: number | undefined) {
  if (!value) {
    return "";
  }

  return `${label} ${value > 0 ? "+" : ""}${value}`;
}

function formatDebugProgress(progress: DebugProgress, t: Translator) {
  if (progress === "ready") {
    return t("debug.ready");
  }

  if (progress === "after_encounter") {
    return t("debug.afterEncounter");
  }

  if (progress === "return_ready") {
    return t("debug.returnReady");
  }

  return t("debug.floorStart", { floor: progress.replace("floor_", "B") + "F" });
}

function getTempoModeForPhase(phase: GameState["phase"]): TempoMode {
  if (phase === "combat") {
    return "combat";
  }

  if (phase === "dungeon") {
    return "dungeon";
  }

  return "idle";
}

function runTempoStep(state: GameState, mode: Exclude<TempoMode, "idle">, t: Translator) {
  if (mode === "combat") {
    return runTempoCombatStep(state, t);
  }

  return runTempoDungeonStep(state, t);
}

function runTempoCombatStep(state: GameState, t: Translator) {
  if (state.phase !== "combat" || !state.combat) {
    return { state, keepRunning: false, status: t("tempo.autoStoppedClear") };
  }

  if (state.combat.enemy.isBoss || state.combat.enemy.role === "boss" || state.combat.enemy.role === "miniboss") {
    return { state, keepRunning: false, status: t("tempo.autoStoppedBoss") };
  }

  if (state.party.some((member) => member.injury || member.hp <= Math.ceil(member.maxHp * 0.35))) {
    return { state, keepRunning: false, status: t("tempo.autoStoppedDanger") };
  }

  const target = state.combat.enemyGroups.find((group) => group.count > 0);
  const activeParty = state.party.filter((member) => member.hp > 0 && !member.injury);
  if (activeParty.length === 0 || !target) {
    return { state, keepRunning: false, status: t("tempo.autoStoppedDanger") };
  }

  const hasStandingFront = activeParty.some((member) => member.row === "front");
  const actions: CombatActionDeclaration[] = activeParty.map((member) =>
    member.row === "front" || !hasStandingFront
      ? { actorId: member.id, action: "attack", targetGroupId: target.id }
      : { actorId: member.id, action: "defend" }
  );
  const next = executeCommand(state, defaultWorld, {
    type: "declare_round",
    actions
  });

  if (next.phase !== "combat") {
    return { state: next, keepRunning: false, status: t("tempo.autoStoppedClear") };
  }

  if (next.party.some((member) => member.injury || member.hp <= Math.ceil(member.maxHp * 0.35))) {
    return { state: next, keepRunning: false, status: t("tempo.autoStoppedDanger") };
  }

  return { state: next, keepRunning: true, status: "" };
}

function runTempoDungeonStep(state: GameState, t: Translator) {
  if (state.phase !== "dungeon" || !state.position) {
    return { state, keepRunning: false, status: t("tempo.autoMoveStoppedEvent") };
  }

  if (state.party.some((member) => member.injury || member.hp <= Math.ceil(member.maxHp * 0.35))) {
    return { state, keepRunning: false, status: t("tempo.autoStoppedDanger") };
  }

  const room = getRoom(defaultWorld, state.position.roomId);
  const exits = Object.entries(room.exits).filter(([, target]) => Boolean(target));
  const currentExit = room.exits[state.position.facing];
  if (room.trap || room.encounter || room.event || room.gates?.length || room.stairsToTown) {
    return { state, keepRunning: false, status: t("tempo.autoMoveStoppedEvent") };
  }

  if (!currentExit || exits.length > 2) {
    return { state, keepRunning: false, status: t("tempo.autoMoveStoppedBranch") };
  }

  const next = executeCommand(state, defaultWorld, { type: "move_forward" });
  if (next === state || next.phase !== "dungeon") {
    return { state: next, keepRunning: false, status: t("tempo.autoMoveStoppedEvent") };
  }

  const nextRoom = next.position ? getRoom(defaultWorld, next.position.roomId) : null;
  if (nextRoom?.trap || nextRoom?.encounter || nextRoom?.event || nextRoom?.gates?.length || nextRoom?.stairsToTown) {
    return { state: next, keepRunning: false, status: t("tempo.autoMoveStoppedEvent") };
  }

  return { state: next, keepRunning: true, status: "" };
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
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
