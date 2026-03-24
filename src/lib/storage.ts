import type { AthleteProfile, AppSettings, SavedWorkout, Session, WeeklyPlan } from '../types';
import { DEFAULT_PROFILE, DEFAULT_MODEL } from '../constants/defaultProfile';
import { v4 as uuidv4 } from 'uuid';

const KEYS = {
  PROFILE: 'swim_profile',
  SETTINGS: 'swim_settings',
  WORKOUTS: 'swim_workouts',
} as const;

// Profile
export function getProfile(): AthleteProfile {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    return raw ? (JSON.parse(raw) as AthleteProfile) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: AthleteProfile): void {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

// Settings
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    const defaults: AppSettings = { apiKey: '', theme: 'dark', model: DEFAULT_MODEL };
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<AppSettings>) } : defaults;
  } catch {
    return { apiKey: '', theme: 'dark', model: DEFAULT_MODEL };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// Workouts (history)
export function getWorkouts(): SavedWorkout[] {
  try {
    const raw = localStorage.getItem(KEYS.WORKOUTS);
    return raw ? (JSON.parse(raw) as SavedWorkout[]) : [];
  } catch {
    return [];
  }
}

function saveWorkouts(workouts: SavedWorkout[]): void {
  localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts));
}

export function saveSession(session: Session, label?: string): SavedWorkout {
  const workouts = getWorkouts();
  const entry: SavedWorkout = {
    id: uuidv4(),
    type: 'session',
    data: session,
    savedAt: new Date().toISOString(),
    label: label ?? `${session.focus} — ${session.day}`,
  };
  workouts.unshift(entry);
  saveWorkouts(workouts);
  return entry;
}

export function saveWeeklyPlan(plan: WeeklyPlan, label?: string): SavedWorkout {
  const workouts = getWorkouts();
  const entry: SavedWorkout = {
    id: uuidv4(),
    type: 'weekly_plan',
    data: plan,
    savedAt: new Date().toISOString(),
    label: label ?? `${plan.phase} Week`,
  };
  workouts.unshift(entry);
  saveWorkouts(workouts);
  return entry;
}

export function deleteWorkout(id: string): void {
  const workouts = getWorkouts().filter((w) => w.id !== id);
  saveWorkouts(workouts);
}
