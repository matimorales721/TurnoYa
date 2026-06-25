import { type CSSProperties, useEffect, useRef, useState } from "react";
import { DurationSelector } from "./components/DurationSelector";
import { PlayerCard } from "./components/PlayerCard";
import { SettingsBar } from "./components/SettingsBar";
import { TimerButton } from "./components/TimerButton";
import { useTurnTimer } from "./hooks/useTurnTimer";
import type { AlarmSound } from "./utils/sound";

const DURATIONS = [15, 30, 45, 60];
const INITIAL_PLAYERS = [
  { id: "mati", name: "Mati", color: "#3b82f6" },
  { id: "marcos", name: "Marcos", color: "#22c55e" },
  { id: "ingrid", name: "Ingrid", color: "#f97316" },
  { id: "gabi", name: "Gabi", color: "#8b5cf6" },
  { id: "dan", name: "Dan", color: "#ef4444" },
];
const DEFAULT_PLAYERS = INITIAL_PLAYERS.slice(0, 3);
const PLAYER_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ef4444", "#14b8a6", "#eab308", "#ec4899"];
const PLAYER_COUNT_OPTIONS = [2, 3, 4, 5, 6, 7, 8];
const STORAGE_KEY = "turnoya.players";

type Player = {
  id: string;
  name: string;
  color: string;
};

type StoredPlayers = {
  currentPlayerIndex: number;
  players: Player[];
};

type RawStoredPlayers = Partial<StoredPlayers>;

function createDefaultPlayer(index: number) {
  return {
    id: INITIAL_PLAYERS[index]?.id ?? `jugador-${index + 1}`,
    name: INITIAL_PLAYERS[index]?.name ?? `Jugador ${index + 1}`,
    color: INITIAL_PLAYERS[index]?.color ?? PLAYER_COLORS[index % PLAYER_COLORS.length],
  };
}

function createNextPlayer(currentPlayers: Player[]) {
  const existingIds = new Set(currentPlayers.map((player) => player.id));
  const nextDefaultPlayer = INITIAL_PLAYERS.find((player) => !existingIds.has(player.id));

  if (nextDefaultPlayer) {
    return nextDefaultPlayer;
  }

  let playerNumber = currentPlayers.length + 1;
  let id = `jugador-${playerNumber}`;

  while (existingIds.has(id)) {
    playerNumber += 1;
    id = `jugador-${playerNumber}`;
  }

  return {
    id,
    name: `Jugador ${playerNumber}`,
    color: PLAYER_COLORS[(playerNumber - 1) % PLAYER_COLORS.length],
  };
}

function normalizeStoredPlayers(players: Player[]) {
  const usedIds = new Set<string>();

  return players
    .filter((player) => typeof player.name === "string" && /^#[0-9a-fA-F]{6}$/.test(player.color))
    .map((player, index) => {
      const matchingDefault = INITIAL_PLAYERS.find(
        (defaultPlayer) => defaultPlayer.name.toLowerCase() === player.name.toLowerCase(),
      );
      const fallbackId = matchingDefault?.id ?? createDefaultPlayer(index).id;
      let id = player.id || fallbackId;

      if (usedIds.has(id)) {
        id = `jugador-${index + 1}`;
      }

      usedIds.add(id);

      return {
        id,
        name: player.name,
        color: player.color,
      };
    });
}

function getStoredPlayers(): StoredPlayers {
  if (typeof window === "undefined") {
    return {
      currentPlayerIndex: 0,
      players: DEFAULT_PLAYERS,
    };
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return {
      currentPlayerIndex: 0,
      players: DEFAULT_PLAYERS,
    };
  }

  try {
    const storedPlayers = JSON.parse(storedValue) as RawStoredPlayers;
    const validPlayers = normalizeStoredPlayers(storedPlayers.players ?? []);

    if (!validPlayers || validPlayers.length < 2 || validPlayers.length > 8) {
      return {
        currentPlayerIndex: 0,
        players: DEFAULT_PLAYERS,
      };
    }

    return {
      currentPlayerIndex: Math.min(Math.max(storedPlayers.currentPlayerIndex ?? 0, 0), validPlayers.length - 1),
      players: validPlayers,
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);

    return {
      currentPlayerIndex: 0,
      players: DEFAULT_PLAYERS,
    };
  }
}

function getDarkerColor(hexColor: string) {
  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);
  const darken = (value: number) => Math.max(0, Math.round(value * 0.68));

  return `rgb(${darken(red)}, ${darken(green)}, ${darken(blue)})`;
}

export default function App() {
  const [initialPlayers] = useState(getStoredPlayers);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [customDurationValue, setCustomDurationValue] = useState("2");
  const [customDurationUnit, setCustomDurationUnit] = useState<"seconds" | "minutes">("minutes");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alarmSound, setAlarmSound] = useState<AlarmSound>("medium");
  const [players, setPlayers] = useState(initialPlayers.players);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(initialPlayers.currentPlayerIndex);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const startAfterPlayerChangeRef = useRef(false);
  const draggingPlayerIdRef = useRef<string | null>(null);
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);
  const currentPlayer = players[currentPlayerIndex];
  const currentPlayerDarkColor = getDarkerColor(currentPlayer.color);
  const durationIsValid = durationSeconds > 0;

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentPlayerIndex,
        players,
      }),
    );
  }, [currentPlayerIndex, players]);

  const timer = useTurnTimer({
    alarmSound,
    durationSeconds,
    soundEnabled,
    vibrationEnabled: false,
  });

  useEffect(() => {
    if (!startAfterPlayerChangeRef.current) {
      return;
    }

    startAfterPlayerChangeRef.current = false;
    timer.restart();
  }, [currentPlayerIndex, timer]);

  const advancePlayer = () => {
    setCurrentPlayerIndex((index) => (index + 1) % players.length);
  };

  const advanceAndStart = () => {
    advancePlayer();
    timer.restart();
  };

  const selectPlayer = (index: number) => {
    timer.reset();
    setCurrentPlayerIndex(index);
    setEditingPlayerIndex(null);
  };

  const selectPlayerAndStart = (index: number) => {
    timer.reset();
    if (index === currentPlayerIndex) {
      timer.restart();
      setEditingPlayerIndex(null);
      return;
    }

    startAfterPlayerChangeRef.current = true;
    setCurrentPlayerIndex(index);
    setEditingPlayerIndex(null);
  };

  const updatePlayer = (index: number, updates: Partial<Player>) => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player, playerIndex) => (playerIndex === index ? { ...player, ...updates } : player)),
    );
  };

  const startPlayerDrag = (playerId: string) => {
    draggingPlayerIdRef.current = playerId;
    setDraggingPlayerId(playerId);
  };

  const reorderDraggedPlayer = (targetPlayerId: string) => {
    const sourcePlayerId = draggingPlayerIdRef.current;

    if (!sourcePlayerId || sourcePlayerId === targetPlayerId) {
      return;
    }

    const selectedPlayerId = players[currentPlayerIndex]?.id;
    const editingPlayerId = editingPlayerIndex === null ? null : players[editingPlayerIndex]?.id;

    setPlayers((currentPlayers) => {
      const sourceIndex = currentPlayers.findIndex((player) => player.id === sourcePlayerId);
      const targetIndex = currentPlayers.findIndex((player) => player.id === targetPlayerId);

      if (sourceIndex < 0 || targetIndex < 0) {
        return currentPlayers;
      }

      const nextPlayers = [...currentPlayers];
      const [movedPlayer] = nextPlayers.splice(sourceIndex, 1);
      nextPlayers.splice(targetIndex, 0, movedPlayer);

      const nextSelectedIndex = nextPlayers.findIndex((player) => player.id === selectedPlayerId);
      setCurrentPlayerIndex(nextSelectedIndex >= 0 ? nextSelectedIndex : 0);

      if (editingPlayerId) {
        const nextEditingIndex = nextPlayers.findIndex((player) => player.id === editingPlayerId);
        setEditingPlayerIndex(nextEditingIndex >= 0 ? nextEditingIndex : null);
      }

      return nextPlayers;
    });
  };

  const endPlayerDrag = () => {
    draggingPlayerIdRef.current = null;
    setDraggingPlayerId(null);
  };

  const setPlayerCount = (count: number) => {
    setPlayers((currentPlayers) => {
      if (count === currentPlayers.length) {
        return currentPlayers;
      }

      if (count < currentPlayers.length) {
        return currentPlayers.slice(0, count);
      }

      const nextPlayers = [...currentPlayers];

      while (nextPlayers.length < count) {
        nextPlayers.push(createNextPlayer(nextPlayers));
      }

      return nextPlayers;
    });

    setCurrentPlayerIndex((index) => Math.min(index, count - 1));
    setEditingPlayerIndex((index) => {
      if (index === null) {
        return null;
      }

      return index >= count ? null : index;
    });
    timer.reset();
  };

  const handleTap = () => {
    if (timer.state === "READY") {
      if (!durationIsValid) {
        return;
      }

      timer.start();
      return;
    }

    if (timer.state === "RUNNING") {
      timer.reset();
      advancePlayer();
      return;
    }

    if (timer.state === "ALARMING") {
      timer.stopAlarm();
      advancePlayer();
    }
  };

  const handleDoubleTap = () => {
    if (timer.state === "READY") {
      if (!durationIsValid) {
        return;
      }

      timer.restart();
      return;
    }

    advanceAndStart();
  };

  const durationSelector = (
    <DurationSelector
      customUnit={customDurationUnit}
      customValue={customDurationValue}
      disabled={timer.state === "RUNNING"}
      onCustomChange={(value) => {
        const nextValue = value.replace(",", ".");
        setCustomDurationValue(nextValue);

        const numericValue = Number(nextValue);
        const nextSeconds = customDurationUnit === "minutes" ? numericValue * 60 : numericValue;

        if (nextValue.trim() !== "" && Number.isFinite(nextSeconds) && nextSeconds > 0) {
          setDurationSeconds(Math.min(999, Math.round(nextSeconds)));
        } else {
          setDurationSeconds(-1);
        }
      }}
      onCustomUnitChange={(unit) => {
        setCustomDurationUnit(unit);

        const numericValue = Number(customDurationValue);
        const nextSeconds = unit === "minutes" ? numericValue * 60 : numericValue;

        if (customDurationValue.trim() !== "" && Number.isFinite(nextSeconds) && nextSeconds > 0) {
          setDurationSeconds(Math.min(999, Math.round(nextSeconds)));
        }
      }}
      onChange={setDurationSeconds}
      options={DURATIONS}
      value={durationSeconds}
    />
  );

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <p className="eyebrow">
            <span className="brand-icon">⏱</span>
            <span className="brand-turno">Turno</span>
            <span className="brand-ya">Ya</span>
          </p>
          <h1>Temporizador de mesa</h1>
        </div>
      </header>

      <section className="timer-section" aria-label="Temporizador de turno">
        <div className="player-panel" style={{ "--player-color": currentPlayer.color } as CSSProperties}>
          <div className="player-panel-header">
            <p className="player-turn">Turno de {currentPlayer.name}</p>
            <p className="player-panel-hint">
              Toca un nombre para elegir turno. Arrastralo para ordenar. Mantenelo presionado para editar.
            </p>
          </div>
          <div className={`player-list players-${Math.min(players.length, 8)}`} aria-label="Jugadores">
            {players.map((player, index) => (
              <PlayerCard
                color={player.color}
                dragging={draggingPlayerId === player.id}
                editing={editingPlayerIndex === index}
                id={player.id}
                index={index}
                key={player.id}
                name={player.name}
                onColorChange={(color) => updatePlayer(index, { color })}
                onDragEnd={endPlayerDrag}
                onDragMove={reorderDraggedPlayer}
                onDragStart={startPlayerDrag}
                onEditToggle={() => setEditingPlayerIndex((currentIndex) => (currentIndex === index ? null : index))}
                onNameChange={(name) => updatePlayer(index, { name })}
                onSelect={() => selectPlayer(index)}
                onSelectAndStart={() => {
                  if (durationIsValid) {
                    selectPlayerAndStart(index);
                  }
                }}
                selected={index === currentPlayerIndex}
              />
            ))}
          </div>
        </div>

        <TimerButton
          isWarning={timer.isWarning}
          onDoubleTap={handleDoubleTap}
          onLongPress={timer.reset}
          onTap={handleTap}
          remainingSeconds={timer.remainingSeconds}
          totalSeconds={durationSeconds}
          state={timer.state}
          disabled={!durationIsValid}
          playerColor={currentPlayer.color}
          playerDarkColor={currentPlayerDarkColor}
          playerName={currentPlayer.name}
        />

        <div className="usage-guide" aria-label="Instrucciones de uso">
          <div className="usage-item">
            <strong>1 toque</strong>
            <span>Inicia o deja listo al siguiente</span>
          </div>
          <div className="usage-item">
            <strong>2 toques</strong>
            <span>Pasa y arranca</span>
          </div>
          <div className="usage-item">
            <strong>Mantener</strong>
            <span>Cancela el turno actual</span>
          </div>
        </div>

        <div className="setup-panel" aria-label="Opciones de partida">
          <div className="duration-dock">{durationSelector}</div>
          <div className="player-count-card">
            <span className="player-settings-icon" aria-hidden="true">
              {"\u{1F465}"}
            </span>
            <span className="player-count-label">{players.length} jugadores</span>
            <div className="player-count-options">
              {PLAYER_COUNT_OPTIONS.map((count) => (
                <button
                  className={players.length === count ? "player-count-option selected" : "player-count-option"}
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  type="button"
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <SettingsBar
            alarmSound={alarmSound}
            soundEnabled={soundEnabled}
            onAlarmSoundChange={setAlarmSound}
            onSoundChange={setSoundEnabled}
          />
        </div>
      </section>
    </main>
  );
}
