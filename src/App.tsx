import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  DoorOpen,
  Footprints,
  FolderOpen,
  LogOut,
  Save,
  Swords,
  Volume2,
  Search,
  ShieldCheck
} from "lucide-react";
import { DungeonView } from "./components/DungeonView";
import { MapPanel } from "./components/MapPanel";
import { AiProposalPanel } from "./components/AiProposalPanel";
import { AiSettingsPanel } from "./components/AiSettingsPanel";
import { createCharacter, createInitialGameState, addCharacter } from "./domain/gameState";
import { getLocalizedRoomText } from "./domain/scenario";
import { executeCommand } from "./domain/rulesEngine";
import { projectEventToLog } from "./domain/replayLog";
import type { Command, GameState } from "./domain/types";
import { createDebugStateFromProgress, parseDebugProgress, type DebugProgress } from "./debug/debugStart";
import { runHeadlessClear } from "./headless/headlessRunner";
import { defaultWorld } from "./data/defaultWorld";
import { guardNarration } from "./services/aiPolicyGuard";
import { requestNarration } from "./services/narratorService";
import { fromSaveDataV1, toSaveDataV1 } from "./domain/saveData";
import { LocalStorageSaveRepository, type SaveSlotSummary } from "./services/saveRepository";
import { createTranslator, type Locale, type Translator } from "./i18n";
import { loadLocale, saveLocale as persistLocale } from "./services/settingsRepository";
import { loadAiSettings, saveAiSettings, type AiSettings } from "./services/aiSettings";

interface CharacterDraft {
  name: string;
  notes: string;
  portraitRef?: string;
}

export function App() {
  const [debugMode] = useState(() => isDebugModeEnabled());
  const [debugProgress, setDebugProgress] = useState<DebugProgress>(() => getDebugProgressFromLocation());
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [state, setState] = useState<GameState>(() =>
    withAiEnabled(
      debugMode ? createDebugStateFromProgress(defaultWorld, getDebugProgressFromLocation()) : createInitialGameState(),
      aiSettings.enabled
    )
  );
  const [draft, setDraft] = useState<CharacterDraft>({ name: "", notes: "" });
  const [narration, setNarration] = useState("");
  const [narrationStatus, setNarrationStatus] = useState("");
  const [narrationRejected, setNarrationRejected] = useState(false);
  const [headlessStatus, setHeadlessStatus] = useState("");
  const saveRepository = useMemo(() => createBrowserSaveRepository(), []);
  const [locale, setLocale] = useState<Locale>(() => loadLocale());
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [saveSlotId, setSaveSlotId] = useState("autosave");
  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>(() => createBrowserSaveRepository()?.list() ?? []);
  const [saveStatus, setSaveStatus] = useState("");

  const roomText = useMemo(() => {
    if (!state.position) {
      return null;
    }

    return getLocalizedRoomText(defaultWorld, state.position.roomId, locale);
  }, [locale, state.position]);

  function run(command: Command) {
    setState((current) => executeCommand(current, defaultWorld, command));
  }

  function loadDebugProgress() {
    setState(withAiEnabled(createDebugStateFromProgress(defaultWorld, debugProgress), aiSettings.enabled));
    setHeadlessStatus("");
  }

  function runHeadless() {
    const result = runHeadlessClear(state, defaultWorld);
    setState(result.state);
    setHeadlessStatus(t("debug.headlessStatus", { reason: result.reason, count: result.commands.length }));
  }

  function addDraftCharacter() {
    const character = createCharacter(draft);
    setState((current) => addCharacter(current, character));
    setDraft({ name: "", notes: "" });
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

  async function narrate() {
    setNarrationStatus(t("log.requesting"));
    setNarrationRejected(false);
    const proposal = await requestNarration(state, defaultWorld, aiSettings);
    const guarded = guardNarration(state, defaultWorld, proposal);

    if (!guarded.accepted) {
      setNarration("");
      setNarrationStatus(guarded.reason ?? t("log.rejected"));
      setNarrationRejected(true);
      return;
    }

    setNarration(guarded.prose);
    setNarrationStatus(proposal.source === "local_ai" ? t("log.localProposal") : t("log.fallbackProposal"));
  }

  function saveGame() {
    if (!saveRepository) {
      setSaveStatus(t("save.unavailable"));
      return;
    }

    const save = toSaveDataV1(state, defaultWorld, { locale });
    saveRepository.write(saveSlotId, save);
    setSaveSlots(saveRepository.list());
    setSaveStatus(t("save.saved", { slot: saveSlotId }));
  }

  function loadGame() {
    if (!saveRepository) {
      setSaveStatus(t("save.unavailable"));
      return;
    }

    const result = saveRepository.read(saveSlotId);
    if (!result.ok) {
      setSaveStatus(result.message);
      return;
    }

    setState(fromSaveDataV1(result.save));
    changeLocale(result.save.settings.locale);
    setSaveStatus(createTranslator(result.save.settings.locale)("save.loaded", { slot: saveSlotId }));
  }

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    persistLocale(nextLocale);
  }

  function updateAiSettings(nextSettings: AiSettings) {
    setAiSettings(nextSettings);
    saveAiSettings(nextSettings);
    setState((current) => withAiEnabled(current, nextSettings.enabled));
    setNarrationStatus(t("ai.settingsSaved"));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>{t("app.title")}</h1>
          <p>{t("app.subtitle")}</p>
        </div>
        <div className="topbar-tools">
          <label className="locale-control">
            {t("locale.label")}
            <select value={locale} onChange={(event) => changeLocale(event.target.value as Locale)}>
              <option value="en">{t("locale.en")}</option>
              <option value="ja">{t("locale.ja")}</option>
            </select>
          </label>
          <div className="save-controls" aria-label={t("save.controls")}>
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
            <button type="button" onClick={saveGame}>
              <Save size={18} />
              {t("save.save")}
            </button>
            <button type="button" onClick={loadGame}>
              <FolderOpen size={18} />
              {t("save.load")}
            </button>
            <small aria-live="polite">{saveStatus || t("save.slots", { count: saveSlots.length })}</small>
          </div>
        </div>
      </header>

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
              <option value="ready">{t("debug.ready")}</option>
              <option value="after_encounter">{t("debug.afterEncounter")}</option>
              <option value="clear_ready">{t("debug.clearReady")}</option>
            </select>
          </label>
          <button type="button" onClick={loadDebugProgress}>{t("debug.loadProgress")}</button>
          <button type="button" onClick={runHeadless}>{t("debug.headlessClear")}</button>
          {headlessStatus && <strong>{headlessStatus}</strong>}
        </section>
      )}

      <section className="game-grid">
        <aside className="panel party-panel" aria-labelledby="party-heading">
          <div className="section-title">
            <h2 id="party-heading">{t("party.heading")}</h2>
            <span>{state.party.length}/4</span>
          </div>

          <div className="roster" aria-live="polite">
            {state.party.length === 0 ? (
              <p className="empty-state">{t("party.empty")}</p>
            ) : (
              state.party.map((member) => (
                <article className="party-member" key={member.id}>
                  <div className="portrait">
                    {member.portraitRef && !member.portraitRef.startsWith("debug://") ? (
                      <img src={member.portraitRef} alt="" />
                    ) : (
                      <span>{member.name.slice(0, 1)}</span>
                    )}
                  </div>
                  <div>
                    <h3>{member.name}</h3>
                    <p>{member.notes || t("party.noNotes")}</p>
                    <small>
                      {t("party.hpAtk", { hp: member.hp, maxHp: member.maxHp, attack: member.attack })}
                    </small>
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
                {t("party.notes")}
                <textarea
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder={t("party.notesPlaceholder")}
                />
              </label>
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
              <button type="submit">{t("party.add")}</button>
            </form>
          )}
        </aside>

        <section className="panel play-panel" aria-labelledby="location-heading">
          <div className="section-title">
            <h2 id="location-heading">{state.phase === "town" ? t("play.town") : state.phase === "combat" ? t("play.combat") : roomText?.name}</h2>
            <span>{state.position ? t("play.facing", { direction: t(`direction.${state.position.facing}`) }) : t("play.safe")}</span>
          </div>

          {state.phase === "town" ? (
            <div className="town-view">
              <div className="town-scene" aria-hidden="true" />
              <p>
                {t("play.townCopy")}
              </p>
              <button type="button" className="primary-action" onClick={() => run({ type: "enter_dungeon" })}>
                <DoorOpen size={18} />
                {t("play.enterDungeon")}
              </button>
            </div>
          ) : (
            <>
              <DungeonView state={state} world={defaultWorld} label={t("play.dungeonView")} />
              <MapPanel state={state} world={defaultWorld} locale={locale} t={t} />
              <div className="room-copy">
                <p>{state.phase === "combat" ? t("play.combatDescription", { enemy: state.combat?.enemy.name ?? "" }) : roomText?.description}</p>
              </div>
              {state.phase === "combat" ? (
                <div className="command-bar" aria-label={t("play.combatCommands")}>
                  <button type="button" onClick={() => run({ type: "attack" })}>
                    <Swords size={18} />
                    {t("play.attack")}
                  </button>
                  <button type="button" onClick={() => run({ type: "retreat" })}>
                    <ShieldCheck size={18} />
                    {t("play.retreat")}
                  </button>
                  <span className="enemy-meter">{t("play.enemyHp", { hp: state.combat?.enemy.hp ?? 0 })}</span>
                </div>
              ) : (
                <div className="command-bar" aria-label={t("play.dungeonCommands")}>
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
                  <button type="button" onClick={() => run({ type: "return_to_town" })}>
                    <LogOut size={18} />
                    {t("play.return")}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="panel log-panel" aria-labelledby="log-heading">
          <div className="section-title">
            <h2 id="log-heading">{t("log.heading")}</h2>
            <button type="button" onClick={narrate}>{t("log.replay")}</button>
          </div>
          <ol className="log-list">
            {state.log.length === 0 ? (
              <li className="empty-state">{t("log.empty")}</li>
            ) : (
              state.log
                .slice()
                .reverse()
                .map((entry) => (
                  <li key={entry.id}>
                    <small>{t("log.turn", { turn: entry.turn })}</small>
                    <p>{entry.event ? projectEventToLog(entry.event, locale, defaultWorld)?.text ?? entry.text : entry.text}</p>
                  </li>
                ))
            )}
          </ol>
          <AiProposalPanel status={narrationStatus} prose={narration} rejected={narrationRejected} t={t} />
          <AiSettingsPanel settings={aiSettings} t={t} onChange={updateAiSettings} />
        </aside>
      </section>
    </main>
  );
}

function isDebugModeEnabled() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";
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

  return t("map.heading");
}

function withAiEnabled(state: GameState, enabled: boolean): GameState {
  return {
    ...state,
    aiEnabled: enabled
  };
}
