let audioContext: AudioContext | null = null;
let alarmInterval: number | null = null;

export type AlarmSound = 'calm' | 'medium' | 'loud';

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

export function prepareAudio() {
  const context = getAudioContext();

  if (context.state === 'suspended') {
    void context.resume();
  }
}

function playTone(frequency: number, durationMs: number, volume = 0.18) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + durationMs / 1000 + 0.02);
}

export function playPip() {
  playTone(880, 110, 0.14);
}

function playCalmAlarmPulse() {
  playTone(523, 180, 0.08);
  window.setTimeout(() => playTone(659, 220, 0.07), 210);
}

function playMediumAlarmPulse() {
  playTone(740, 90, 0.18);
  window.setTimeout(() => playTone(370, 90, 0.18), 95);
  window.setTimeout(() => playTone(740, 90, 0.18), 190);
  window.setTimeout(() => playTone(370, 90, 0.18), 285);
  window.setTimeout(() => playTone(988, 180, 0.16), 410);
}

function playLoudAlarmPulse() {
  playTone(1047, 80, 0.24);
  window.setTimeout(() => playTone(523, 80, 0.24), 82);
  window.setTimeout(() => playTone(1047, 80, 0.24), 164);
  window.setTimeout(() => playTone(523, 80, 0.24), 246);
  window.setTimeout(() => playTone(1175, 120, 0.22), 328);
  window.setTimeout(() => playTone(587, 120, 0.22), 452);
}

function getAlarmPulse(alarmSound: AlarmSound) {
  if (alarmSound === 'medium') {
    return playMediumAlarmPulse;
  }

  if (alarmSound === 'loud') {
    return playLoudAlarmPulse;
  }

  return playCalmAlarmPulse;
}

export function previewAlarm(alarmSound: AlarmSound) {
  getAlarmPulse(alarmSound)();
}

export function startAlarm(alarmSound: AlarmSound) {
  stopAlarm();

  const playAlarmPulse = getAlarmPulse(alarmSound);

  playAlarmPulse();
  alarmInterval = window.setInterval(playAlarmPulse, 700);
}

export function stopAlarm() {
  if (alarmInterval === null) {
    return;
  }

  window.clearInterval(alarmInterval);
  alarmInterval = null;
}
