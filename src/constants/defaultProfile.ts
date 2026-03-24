import type { AthleteProfile } from '../types';

export const DEFAULT_PROFILE: AthleteProfile = {
  name: 'Klim',
  age: 16,
  level: 'competitive_regional',
  poolLengthM: 25,
  sessionsPerWeek: 6,
  restDay: 'Sunday',
  events: {
    '50_free': { bestTimeS: 26.6, priority: 'A' },
    '50_fly': { bestTimeS: 27.7, priority: 'A' },
    '100_fly': { bestTimeS: 64.0, priority: 'A' },
  },
  trainingContext:
    'Trains alone without a poolside coach. Self-coached. All instructions must be specific and executable without external cueing.',
  equipment: ['short_fins', 'hand_paddles', 'pull_buoy', 'kickboard', 'resistance_bands_block'],
  sessionVolumeRange: { min: 2500, max: 3500 },
};

export const DEFAULT_MODEL = 'claude-sonnet-4-6';
