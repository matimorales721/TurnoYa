import { type CSSProperties, useRef } from "react";
import type { TimerState } from "../hooks/useTurnTimer";

type TimerButtonProps = {
  disabled: boolean;
  state: TimerState;
  remainingSeconds: number;
  totalSeconds: number;
  isWarning: boolean;
  playerColor: string;
  playerDarkColor: string;
  playerName: string;
  onTap: () => void;
  onDoubleTap: () => void;
  onLongPress: () => void;
};

const LONG_PRESS_MS = 650;
const DOUBLE_TAP_MS = 260;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TimerButton({
  disabled,
  state,
  remainingSeconds,
  totalSeconds,
  isWarning,
  playerColor,
  playerDarkColor,
  playerName,
  onTap,
  onDoubleTap,
  onLongPress,
}: TimerButtonProps) {
  const pressTimerRef = useRef<number | null>(null);
  const tapTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const statusClass = state === "ALARMING" ? "alarm" : isWarning ? "warning" : "ready";
  const label = state === "READY" ? "Iniciar turno" : state === "ALARMING" ? "Tiempo!" : formatTime(remainingSeconds);
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds)) : 0;

  const handlePressStart = () => {
    longPressTriggeredRef.current = false;
    pressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      if (tapTimerRef.current !== null) {
        window.clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      onLongPress();
    }, LONG_PRESS_MS);
  };

  const handlePressEnd = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleClick = () => {
    if (longPressTriggeredRef.current) {
      return;
    }

    if (tapTimerRef.current !== null) {
      window.clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      onDoubleTap();
      return;
    }

    tapTimerRef.current = window.setTimeout(() => {
      tapTimerRef.current = null;
      onTap();
    }, DOUBLE_TAP_MS);
  };

  return (
    <button
      className={`timer-button ${statusClass}`}
      disabled={disabled}
      style={
        {
          "--player-color": playerColor,
          "--player-dark-color": playerDarkColor,
          "--timer-progress": `${progress * 100}%`,
        } as CSSProperties
      }
      aria-label={`Turno de ${playerName}`}
      onClick={handleClick}
      onPointerCancel={handlePressEnd}
      onPointerDown={handlePressStart}
      onPointerLeave={handlePressEnd}
      onPointerUp={handlePressEnd}
      type="button"
    >
      <span className="timer-ring" aria-hidden="true" />
      <span className="timer-content">
        <span className="timer-label">
          {state === "READY" ? (
            <>
              <span>Iniciar</span>
              <span>Turno</span>
            </>
          ) : (
            label
          )}
        </span>
        <span className="timer-state">
          {state === "RUNNING" ? "Turno activo" : state === "ALARMING" ? "Tocar para detener" : "Listo"}
        </span>
      </span>
    </button>
  );
}
