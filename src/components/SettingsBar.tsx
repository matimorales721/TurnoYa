import type { AlarmSound } from '../utils/sound';
import { previewAlarm } from '../utils/sound';

const ALARM_SOUND_OPTIONS: Array<{ emoji: string; label: string; value: AlarmSound }> = [
  { emoji: '\u{1F60C}', label: 'Suave', value: 'calm' },
  { emoji: '\u{1F514}', label: 'Medio', value: 'medium' },
  { emoji: '\u{1F6A8}', label: 'Alarma', value: 'loud' },
];

type SettingsBarProps = {
  alarmSound: AlarmSound;
  soundEnabled: boolean;
  onAlarmSoundChange: (value: AlarmSound) => void;
  onSoundChange: (value: boolean) => void;
};

export function SettingsBar({
  alarmSound,
  soundEnabled,
  onAlarmSoundChange,
  onSoundChange,
}: SettingsBarProps) {
  return (
    <div className="settings-bar">
      <label className="toggle">
        <input
          checked={soundEnabled}
          onChange={(event) => onSoundChange(event.target.checked)}
          type="checkbox"
        />
        <span>Sonido</span>
      </label>

      {soundEnabled && (
        <div className="alarm-sound-selector" aria-label="Sonido de fin de turno">
          {ALARM_SOUND_OPTIONS.map((option) => (
            <button
              className={alarmSound === option.value ? 'alarm-sound-option selected' : 'alarm-sound-option'}
              key={option.value}
              onClick={() => {
                onAlarmSoundChange(option.value);
                previewAlarm(option.value);
              }}
              type="button"
            >
              <span className="alarm-sound-emoji">{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
