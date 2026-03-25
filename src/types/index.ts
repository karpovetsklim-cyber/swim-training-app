export interface AthleteProfile {
  name: string;
  age: number;
  level: string;
  poolLengthM: number;
  sessionsPerWeek: number;
  restDay: string;
  events: Record<string, { bestTimeS: number; priority: 'A' | 'B' | 'C' }>;
  trainingContext: string;
  equipment: string[];
  sessionVolumeRange: { min: number; max: number };
}

export interface SwimSet {
  name: string;
  description: string;
  volumeM: number;
  effort: string;
  rest: string | null;
  equipment: string | null;
  techniqueCue: string | null;
}

export interface Session {
  id: string;
  createdAt: string;
  day: string;
  focus: string;
  energySystem: string;
  totalVolumeM: number;
  sets: SwimSet[];
  specialRequests?: string;
}

export interface WeeklyPlan {
  id: string;
  createdAt: string;
  phase: string;
  sessions: Session[];
  context?: string;
}

export type SavedWorkout = {
  id: string;
  type: 'session' | 'weekly_plan';
  data: Session | WeeklyPlan;
  savedAt: string;
  label: string;
};

export type SessionFocus =
  | 'Power/Speed'
  | 'Aerobic Base'
  | 'Speed Endurance'
  | 'Race-Specific'
  | 'Technique/Recovery'
  | 'IM/Mixed';

export type TrainingPhase = 'BASE' | 'BUILD' | 'TAPER' | 'RECOVERY';

export type AppSettings = {
  theme: 'dark' | 'light';
  model: string;
};
