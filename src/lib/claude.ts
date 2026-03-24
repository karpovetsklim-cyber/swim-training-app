import { SWIM_COACH_SYSTEM_PROMPT } from '../constants/systemPrompt';
import type { AthleteProfile, Session, WeeklyPlan } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  stop_reason: string;
}

function buildProfileContext(profile: AthleteProfile): string {
  const events = Object.entries(profile.events)
    .map(([k, v]) => `  ${k}: best ${v.bestTimeS}s, priority ${v.priority}`)
    .join('\n');

  return `ATHLETE PROFILE:
Name: ${profile.name}
Age: ${profile.age}
Level: ${profile.level}
Pool length: ${profile.poolLengthM}m
Sessions/week: ${profile.sessionsPerWeek}
Rest day: ${profile.restDay}
Events:
${events}
Training context: ${profile.trainingContext}
Equipment available: ${profile.equipment.join(', ')}
Session volume range: ${profile.sessionVolumeRange.min}–${profile.sessionVolumeRange.max}m`;
}

async function callClaude(
  apiKey: string,
  model: string,
  messages: ClaudeMessage[],
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: SWIM_COACH_SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    const message =
      (err as { error?: { message?: string } }).error?.message ?? response.statusText;
    throw new Error(`API error ${response.status}: ${message}`);
  }

  const data = (await response.json()) as ClaudeResponse;
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text in response');
  return textBlock.text;
}

function parseJSON<T>(raw: string): T {
  // Strip markdown fences if present
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

// Raw API response shape matching the coach prompt
interface RawSet {
  name: string;
  description: string;
  volume_m: number;
  effort: string;
  rest: string | null;
  equipment: string | null;
  technique_cue: string | null;
}

interface RawSession {
  day: string;
  focus: string;
  energy_system: string;
  total_volume_m: number;
  sets: RawSet[];
}

function normalizeSession(raw: RawSession, extra?: Partial<Session>): Session {
  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    day: raw.day,
    focus: raw.focus,
    energySystem: raw.energy_system,
    totalVolumeM: raw.total_volume_m,
    sets: raw.sets.map((s) => ({
      name: s.name,
      description: s.description,
      volumeM: s.volume_m,
      effort: s.effort,
      rest: s.rest,
      equipment: s.equipment,
      techniqueCue: s.technique_cue,
    })),
    ...extra,
  };
}

export async function generateSession(
  apiKey: string,
  model: string,
  profile: AthleteProfile,
  focus: string,
  specialRequests?: string,
): Promise<Session> {
  const profileCtx = buildProfileContext(profile);
  const requestText = specialRequests ? `\nSpecial requests/constraints: ${specialRequests}` : '';

  const userMessage = `${profileCtx}

REQUEST: Generate a single training session with focus: ${focus}${requestText}

Return ONLY a single JSON session object matching the output format. No extra text.`;

  const raw = await callClaude(apiKey, model, [{ role: 'user', content: userMessage }]);
  const parsed = parseJSON<RawSession>(raw);
  return normalizeSession(parsed, { focus, specialRequests });
}

export async function generateWeeklyPlan(
  apiKey: string,
  model: string,
  profile: AthleteProfile,
  phase: string,
  context?: string,
): Promise<WeeklyPlan> {
  const profileCtx = buildProfileContext(profile);
  const contextText = context ? `\nAdditional context: ${context}` : '';

  const userMessage = `${profileCtx}

REQUEST: Generate a full Mon–Sat weekly training plan for the ${phase} phase.${contextText}

Return ONLY a JSON array of 6 session objects (Monday through Saturday). No extra text.`;

  const raw = await callClaude(apiKey, model, [{ role: 'user', content: userMessage }]);
  const parsed = parseJSON<RawSession[]>(raw);

  const sessions = parsed.map((s) => normalizeSession(s));

  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    phase,
    sessions,
    context,
  };
}

export async function refineSession(
  apiKey: string,
  model: string,
  profile: AthleteProfile,
  session: Session,
  instruction: string,
): Promise<Session> {
  const profileCtx = buildProfileContext(profile);

  const userMessage = `${profileCtx}

CURRENT SESSION:
${JSON.stringify(session, null, 2)}

REFINEMENT INSTRUCTION: ${instruction}

Return ONLY the modified session as a single JSON object matching the original format (with day, focus, energy_system, total_volume_m, sets). No extra text.`;

  const raw = await callClaude(apiKey, model, [{ role: 'user', content: userMessage }]);
  const parsed = parseJSON<RawSession>(raw);
  return { ...normalizeSession(parsed), id: session.id, createdAt: session.createdAt };
}

export async function refineWeeklyPlan(
  apiKey: string,
  model: string,
  profile: AthleteProfile,
  plan: WeeklyPlan,
  instruction: string,
): Promise<WeeklyPlan> {
  const profileCtx = buildProfileContext(profile);

  const userMessage = `${profileCtx}

CURRENT WEEKLY PLAN (${plan.phase} phase):
${JSON.stringify(plan.sessions, null, 2)}

REFINEMENT INSTRUCTION: ${instruction}

Return ONLY the modified plan as a JSON array of 6 session objects. No extra text.`;

  const raw = await callClaude(apiKey, model, [{ role: 'user', content: userMessage }]);
  const parsed = parseJSON<RawSession[]>(raw);
  const sessions = parsed.map((s) => normalizeSession(s));

  return { ...plan, sessions };
}
