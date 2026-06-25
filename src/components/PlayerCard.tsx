import { type CSSProperties, type PointerEvent, useRef } from 'react';

type PlayerCardProps = {
  color: string;
  dragging: boolean;
  editing: boolean;
  id: string;
  index: number;
  name: string;
  selected: boolean;
  onColorChange: (value: string) => void;
  onDragEnd: () => void;
  onDragMove: (targetPlayerId: string) => void;
  onDragStart: (playerId: string) => void;
  onEditToggle: () => void;
  onNameChange: (value: string) => void;
  onSelect: () => void;
  onSelectAndStart: () => void;
};

const LONG_PRESS_MS = 650;
const DOUBLE_TAP_MS = 260;

export function PlayerCard({
  color,
  dragging,
  editing,
  id,
  index,
  name,
  selected,
  onColorChange,
  onDragEnd,
  onDragMove,
  onDragStart,
  onEditToggle,
  onNameChange,
  onSelect,
  onSelectAndStart,
}: PlayerCardProps) {
  const pressTimerRef = useRef<number | null>(null);
  const tapTimerRef = useRef<number | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const longPressTriggeredRef = useRef(false);
  const displayName = name.trim() || `Jugador ${index + 1}`;

  const handlePressStart = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    longPressTriggeredRef.current = false;
    draggingRef.current = false;
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    pressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      if (tapTimerRef.current !== null) {
        window.clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      onEditToggle();
    }, LONG_PRESS_MS);
  };

  const handlePressEnd = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    pointerStartRef.current = null;

    if (draggingRef.current) {
      draggingRef.current = false;
      suppressClickRef.current = true;
      onDragEnd();
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const pointerStart = pointerStartRef.current;

    if (!pointerStart || longPressTriggeredRef.current) {
      return;
    }

    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (!draggingRef.current && distance > 12) {
      draggingRef.current = true;
      if (pressTimerRef.current !== null) {
        window.clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      if (tapTimerRef.current !== null) {
        window.clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      onDragStart(id);
    }

    if (!draggingRef.current) {
      return;
    }

    const targetElement = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-player-id]');
    const targetPlayerId = targetElement?.dataset.playerId;

    if (targetPlayerId) {
      onDragMove(targetPlayerId);
    }
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    if (longPressTriggeredRef.current || draggingRef.current) {
      return;
    }

    if (tapTimerRef.current !== null) {
      window.clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      onSelectAndStart();
      return;
    }

    tapTimerRef.current = window.setTimeout(() => {
      tapTimerRef.current = null;
      onSelect();
    }, DOUBLE_TAP_MS);
  };

  return (
    <div
      className={`${selected ? 'player-card active' : 'player-card'} ${dragging ? 'dragging' : ''}`}
      data-player-id={id}
      style={{ '--player-color': color } as CSSProperties}
    >
      <button
        className="player-chip"
        onClick={handleClick}
        onPointerCancel={handlePressEnd}
        onPointerDown={handlePressStart}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePressEnd}
        type="button"
      >
        {displayName}
      </button>

      {editing && (
        <div className="player-edit">
          <input
            aria-label={`Nombre del jugador ${index + 1}`}
            maxLength={16}
            onChange={(event) => onNameChange(event.target.value)}
            type="text"
            value={name}
          />
          <input
            aria-label={`Color de ${displayName}`}
            className="player-color-input"
            ref={colorInputRef}
            onChange={(event) => onColorChange(event.target.value)}
            type="color"
            value={color}
          />
          <button
            aria-label={`Cambiar color de ${displayName}`}
            className="player-color-swatch"
            onClick={() => colorInputRef.current?.click()}
            style={{ backgroundColor: color }}
            type="button"
          />
        </div>
      )}
    </div>
  );
}
