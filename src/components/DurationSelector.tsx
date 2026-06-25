type DurationSelectorProps = {
  customUnit: "seconds" | "minutes";
  customValue: string;
  value: number;
  options: number[];
  disabled: boolean;
  onCustomChange: (value: string) => void;
  onCustomUnitChange: (value: "seconds" | "minutes") => void;
  onChange: (value: number) => void;
};

export function DurationSelector({
  customUnit,
  customValue,
  value,
  options,
  disabled,
  onCustomChange,
  onCustomUnitChange,
  onChange,
}: DurationSelectorProps) {
  const isCustomSelected = !options.includes(value);
  const customNumber = Number(customValue);
  const customSeconds = customUnit === "minutes" ? customNumber * 60 : customNumber;
  const customError =
    isCustomSelected &&
    (customValue.trim() === ""
      ? "Ingresá una duración."
      : !Number.isFinite(customNumber) || customNumber <= 0
        ? "Usá un número mayor a 0."
        : customSeconds > 999
          ? "Máximo 999 segundos."
          : "");

  return (
    <div className="duration-control">
      <div className="duration-selector" aria-label="Duracion del turno">
        {options.map((duration) => (
          <button
            className={duration === value ? "duration-option selected" : "duration-option"}
            disabled={disabled}
            key={duration}
            onClick={() => onChange(duration)}
            type="button"
          >
            {duration}s
          </button>
        ))}
        <button
          className={isCustomSelected ? "duration-option selected" : "duration-option"}
          disabled={disabled}
          onClick={() => {
            if (customValue.trim() !== "" && Number.isFinite(customSeconds) && customSeconds > 0) {
              onChange(Math.min(999, Math.round(customSeconds)));
            } else {
              onChange(-1);
            }
          }}
          type="button"
        >
          Otro
        </button>
      </div>

      {isCustomSelected && (
        <div className="custom-duration">
          <label>
            <span>Duración</span>
            <input
              aria-invalid={Boolean(customError)}
              disabled={disabled}
              inputMode="decimal"
              onChange={(event) => onCustomChange(event.target.value)}
              placeholder="Ej: 2"
              type="text"
              value={customValue}
            />
          </label>
          <div className="custom-duration-units" aria-label="Unidad de duracion">
            <button
              className={customUnit === "seconds" ? "selected" : ""}
              disabled={disabled}
              onClick={() => onCustomUnitChange("seconds")}
              type="button"
            >
              seg
            </button>
            <button
              className={customUnit === "minutes" ? "selected" : ""}
              disabled={disabled}
              onClick={() => onCustomUnitChange("minutes")}
              type="button"
            >
              min
            </button>
          </div>
          {customError && <p className="custom-duration-error">{customError}</p>}
        </div>
      )}
    </div>
  );
}
