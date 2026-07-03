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
import { createCharacter, createInitialGameState, addCharacter } from "./domain/gameState";
import { getRoom } from "./domain/scenario";
import { executeCommand } from "./domain/rulesEngine";
import type { Command, GameState } from "./domain/types";
import { createDebugStateFromProgress, parseDebugProgress, type DebugProgress } from "./debug/debugStart";
import { runHeadlessClear } from "./headless/headlessRunner";
import { defaultWorld } from "./data/defaultWorld";
import { guardNarration } from "./services/aiPolicyGuard";
import { requestLocalNarration } from "./services/narratorService";
import { fromSaveDataV1, toSaveDataV1 } from "./domain/saveData";
import { LocalStorageSaveRepository, type SaveSlotSummary } from "./services/saveRepository";

interface CharacterDraft {
  name: string;
  notes: string;
  portraitRef?: string;
}

export function App() {
  const [debugMode] = useState(() => isDebugModeEnabled());
  const [debugProgress, setDebugProgress] = useState<DebugProgress>(() => getDebugProgressFromLocation());
  const [state, setState] = useState<GameState>(() =>
    debugMode ? createDebugStateFromProgress(defaultWorld, getDebugProgressFromLocation()) : createInitialGameState()
  );
  const [draft, setDraft] = useState<CharacterDraft>({ name: "", notes: "" });
  const [narration, setNarration] = useState("");
  const [narrationStatus, setNarrationStatus] = useState("");
  const [headlessStatus, setHeadlessStatus] = useState("");
  const saveRepository = useMemo(() => createBrowserSaveRepository(), []);
  const [saveSlotId, setSaveSlotId] = useState("autosave");
  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>(() => createBrowserSaveRepository()?.list() ?? []);
  const [saveStatus, setSaveStatus] = useState("");

  const room = useMemo(() => {
    if (!state.position) {
      return null;
    }

    return getRoom(defaultWorld, state.position.roomId);
  }, [state.position]);

  function run(command: Command) {
    setState((current) => executeCommand(current, defaultWorld, command));
  }

  function loadDebugProgress() {
    setState(createDebugStateFromProgress(defaultWorld, debugProgress));
    setHeadlessStatus("");
  }

  function runHeadless() {
    const result = runHeadlessClear(state, defaultWorld);
    setState(result.state);
    setHeadlessStatus(`Headless clear: ${result.reason} (${result.commands.length} commands)`);
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
    setNarrationStatus("Requesting local narrator...");
    const proposal = await requestLocalNarration(state, defaultWorld);
    const guarded = guardNarration(state, defaultWorld, proposal);

    if (!guarded.accepted) {
      setNarration("");
      setNarrationStatus(guarded.reason ?? "Narration rejected.");
      return;
    }

    setNarration(guarded.prose);
    setNarrationStatus(proposal.source === "local_ai" ? "Local narration proposal" : "Fallback narration");
  }

  function saveGame() {
    if (!saveRepository) {
      setSaveStatus("Save storage is unavailable.");
      return;
    }

    const save = toSaveDataV1(state, defaultWorld);
    saveRepository.write(saveSlotId, save);
    setSaveSlots(saveRepository.list());
    setSaveStatus(`Saved ${saveSlotId}.`);
  }

  function loadGame() {
    if (!saveRepository) {
      setSaveStatus("Save storage is unavailable.");
      return;
    }

    const result = saveRepository.read(saveSlotId);
    if (!result.ok) {
      setSaveStatus(result.message);
      return;
    }

    setState(fromSaveDataV1(result.save));
    setSaveStatus(`Loaded ${saveSlotId}.`);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Black Stela</h1>
          <p>Town, party, dungeon, combat, return. AI is off by default.</p>
        </div>
        <div className="topbar-tools">
          <div className="save-controls" aria-label="Save controls">
            <label>
              Slot
              <input
                list="save-slots"
                value={saveSlotId}
                onChange={(event) => setSaveSlotId(event.target.value)}
                aria-label="Save slot"
              />
            </label>
            <datalist id="save-slots">
              {saveSlots.map((slot) => (
                <option key={slot.slotId} value={slot.slotId}>
                  {slot.status === "valid" ? slot.savedAt : "Corrupt save"}
                </option>
              ))}
            </datalist>
            <button type="button" onClick={saveGame}>
              <Save size={18} />
              Save game
            </button>
            <button type="button" onClick={loadGame}>
              <FolderOpen size={18} />
              Load game
            </button>
            <small aria-live="polite">{saveStatus || `${saveSlots.length} slots`}</small>
          </div>
          <label className="ai-toggle">
            <input
              type="checkbox"
              checked={state.aiEnabled}
              onChange={(event) => setState((current) => ({ ...current, aiEnabled: event.target.checked }))}
            />
            Local AI
          </label>
        </div>
      </header>

      {debugMode && (
        <section className="debug-panel" aria-labelledby="debug-heading">
          <div>
            <h2 id="debug-heading">Debug Start</h2>
            <p>
              Visited {state.map.visitedRooms.length}/{getTotalRoomCount()} · Phase {state.phase}
            </p>
          </div>
          <label>
            Progress
            <select
              value={debugProgress}
              onChange={(event) => setDebugProgress(parseDebugProgress(event.target.value))}
            >
              <option value="ready">Ready in town</option>
              <option value="after_encounter">After encounter</option>
              <option value="clear_ready">Clear ready</option>
            </select>
          </label>
          <button type="button" onClick={loadDebugProgress}>Load progress</button>
          <button type="button" onClick={runHeadless}>Headless clear</button>
          {headlessStatus && <strong>{headlessStatus}</strong>}
        </section>
      )}

      <section className="game-grid">
        <aside className="panel party-panel" aria-labelledby="party-heading">
          <div className="section-title">
            <h2 id="party-heading">Party Roster</h2>
            <span>{state.party.length}/4</span>
          </div>

          <div className="roster" aria-live="polite">
            {state.party.length === 0 ? (
              <p className="empty-state">Create at least one adventurer before entering the labyrinth.</p>
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
                    <p>{member.notes || "No notes yet."}</p>
                    <small>
                      HP {member.hp}/{member.maxHp} · ATK {member.attack}
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
                Name
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="A player-authored adventurer"
                  required
                />
              </label>
              <label>
                Notes
                <textarea
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Background, vows, scars, table notes"
                />
              </label>
              <label>
                Portrait
                <input
                  data-testid="portrait-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => importPortrait(event.target.files?.[0])}
                />
              </label>
              {draft.portraitRef && <img className="portrait-preview" src={draft.portraitRef} alt="Selected portrait preview" />}
              <button type="submit">Add adventurer</button>
            </form>
          )}
        </aside>

        <section className="panel play-panel" aria-labelledby="location-heading">
          <div className="section-title">
            <h2 id="location-heading">{state.phase === "town" ? "Town" : state.phase === "combat" ? "Combat" : room?.name}</h2>
            <span>{state.position ? `Facing ${state.position.facing}` : "Safe"}</span>
          </div>

          {state.phase === "town" ? (
            <div className="town-view">
              <div className="town-scene" aria-hidden="true" />
              <p>
                Lanterns burn low around the guild hall. The stair beneath the ancient black stela waits for a party that can
                return with a story.
              </p>
              <button type="button" className="primary-action" onClick={() => run({ type: "enter_dungeon" })}>
                <DoorOpen size={18} />
                Enter dungeon
              </button>
            </div>
          ) : (
            <>
              <DungeonView state={state} world={defaultWorld} />
              <div className="room-copy">
                <p>{state.phase === "combat" ? `${state.combat?.enemy.name} stands in the party's path.` : room?.description}</p>
              </div>
              {state.phase === "combat" ? (
                <div className="command-bar" aria-label="Combat commands">
                  <button type="button" onClick={() => run({ type: "attack" })}>
                    <Swords size={18} />
                    Attack
                  </button>
                  <button type="button" onClick={() => run({ type: "retreat" })}>
                    <ShieldCheck size={18} />
                    Retreat
                  </button>
                  <span className="enemy-meter">Enemy HP {state.combat?.enemy.hp}</span>
                </div>
              ) : (
                <div className="command-bar" aria-label="Dungeon commands">
                  <button type="button" aria-label="Turn left" onClick={() => run({ type: "turn_left" })}>
                    <ArrowLeft size={18} />
                  </button>
                  <button type="button" onClick={() => run({ type: "move_forward" })}>
                    <Footprints size={18} />
                    Move
                  </button>
                  <button type="button" aria-label="Turn right" onClick={() => run({ type: "turn_right" })}>
                    <ArrowRight size={18} />
                  </button>
                  <button type="button" onClick={() => run({ type: "search" })}>
                    <Search size={18} />
                    Search
                  </button>
                  <button type="button" onClick={() => run({ type: "listen" })}>
                    <Volume2 size={18} />
                    Listen
                  </button>
                  <button type="button" onClick={() => run({ type: "return_to_town" })}>
                    <LogOut size={18} />
                    Return
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="panel log-panel" aria-labelledby="log-heading">
          <div className="section-title">
            <h2 id="log-heading">Adventure Log</h2>
            <button type="button" onClick={narrate}>Replay prose</button>
          </div>
          <ol className="log-list">
            {state.log.length === 0 ? (
              <li className="empty-state">Canonical events will appear here.</li>
            ) : (
              state.log
                .slice()
                .reverse()
                .map((entry) => (
                  <li key={entry.id}>
                    <small>Turn {entry.turn}</small>
                    <p>{entry.text}</p>
                  </li>
                ))
            )}
          </ol>
          <div className="narration-box" aria-live="polite">
            <small>{narrationStatus || "Narrator idle"}</small>
            {narration && <p>{narration}</p>}
          </div>
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
