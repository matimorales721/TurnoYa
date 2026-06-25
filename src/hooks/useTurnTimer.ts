import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AlarmSound,
  playPip,
  prepareAudio,
  startAlarm as startAlarmSound,
  stopAlarm as stopAlarmSound,
} from '../utils/sound';

export type TimerState = 'READY' | 'RUNNING' | 'ALARMING';

type UseTurnTimerOptions = {
  alarmSound: AlarmSound;
  durationSeconds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

export function useTurnTimer({
  alarmSound,
  durationSeconds,
  soundEnabled,
  vibrationEnabled,
}: UseTurnTimerOptions) {
  const [state, setState] = useState<TimerState>('READY');
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const intervalRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);
  const stateRef = useRef<TimerState>('READY');

  const vibrate = useCallback((pattern: VibratePattern) => {
    if (vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [vibrationEnabled]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearAlarmTimeout = useCallback(() => {
    if (alarmTimeoutRef.current !== null) {
      window.clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
  }, []);

  const silenceAlarm = useCallback(() => {
    clearAlarmTimeout();
    stopAlarmSound();
    vibrate(0);
  }, [clearAlarmTimeout, vibrate]);

  const stopAlarm = useCallback(() => {
    silenceAlarm();
    setState('READY');
    stateRef.current = 'READY';
    setRemainingSeconds(Math.max(0, durationSeconds));
  }, [durationSeconds, silenceAlarm]);

  const reset = useCallback(() => {
    clearTimer();
    silenceAlarm();
    setState('READY');
    stateRef.current = 'READY';
    setRemainingSeconds(Math.max(0, durationSeconds));
  }, [clearTimer, durationSeconds, silenceAlarm]);

  const start = useCallback(() => {
    if (durationSeconds <= 0) {
      return;
    }

    clearTimer();
    silenceAlarm();
    if (soundEnabled) {
      prepareAudio();
    }
    setState('RUNNING');
    stateRef.current = 'RUNNING';
    setRemainingSeconds(durationSeconds);

    intervalRef.current = window.setInterval(() => {
      setRemainingSeconds((current) => {
        const next = current - 1;

        if (next > 0 && next <= 5) {
          if (soundEnabled) {
            playPip();
          }
          vibrate(45);
        }

        if (next <= 0) {
          clearTimer();
          setState('ALARMING');
          stateRef.current = 'ALARMING';
          if (soundEnabled) {
            startAlarmSound(alarmSound);
            alarmTimeoutRef.current = window.setTimeout(() => {
              stopAlarmSound();
              vibrate(0);
              alarmTimeoutRef.current = null;
            }, 3000);
          }
          vibrate([180, 90, 180, 90, 300]);
          return 0;
        }

        return next;
      });
    }, 1000);
  }, [alarmSound, clearTimer, durationSeconds, silenceAlarm, soundEnabled, vibrate]);

  const restart = useCallback(() => {
    start();
  }, [start]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state === 'READY') {
      setRemainingSeconds(Math.max(0, durationSeconds));
    }
  }, [durationSeconds, state]);

  useEffect(() => {
    return () => {
      clearTimer();
      silenceAlarm();
    };
  }, [clearTimer, silenceAlarm]);

  return {
    state,
    remainingSeconds,
    isWarning: state === 'RUNNING' && remainingSeconds <= 5,
    start,
    stopAlarm,
    reset,
    restart,
  };
}
