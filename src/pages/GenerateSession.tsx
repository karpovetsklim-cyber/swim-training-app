import { useState } from 'react';
import { Zap, AlertCircle } from 'lucide-react';
import { SessionView } from '../components/session/SessionView';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { generateSession, refineSession } from '../lib/claude';
import { getProfile, getSettings, saveSession } from '../lib/storage';
import type { Session, SessionFocus } from '../types';

const SESSION_FOCUSES: SessionFocus[] = [
  'Power/Speed',
  'Aerobic Base',
  'Speed Endurance',
  'Race-Specific',
  'Technique/Recovery',
  'IM/Mixed',
];

export function GenerateSession() {
  const [focus, setFocus] = useState<SessionFocus>('Power/Speed');
  const [specialRequests, setSpecialRequests] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [rawError, setRawError] = useState<string | null>(null);

  const settings = getSettings();
  const profile = getProfile();

  async function handleGenerate() {
    if (!settings.apiKey) {
      setError('No API key set. Please add your Anthropic API key in Settings.');
      return;
    }
    setLoading(true);
    setError(null);
    setRawError(null);
    setSaved(false);
    try {
      const result = await generateSession(
        settings.apiKey,
        settings.model,
        profile,
        focus,
        specialRequests || undefined,
      );
      setSession(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefine(instruction: string) {
    if (!session || !settings.apiKey) return;
    setRefining(true);
    setError(null);
    setRawError(null);
    try {
      const result = await refineSession(settings.apiKey, settings.model, profile, session, instruction);
      setSession(result);
      setSaved(false);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setError('Refinement failed. ' + raw);
      if (raw.includes('{') || raw.includes('[')) setRawError(raw);
    } finally {
      setRefining(false);
    }
  }

  function handleSave(s: Session) {
    saveSession(s);
    setSaved(true);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Generate Session</h1>
        <p className="text-gray-400 text-sm">Pick a focus and let the AI build your workout.</p>
      </div>

      {/* Generator form */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Session Focus</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SESSION_FOCUSES.map((f) => (
              <button
                key={f}
                onClick={() => setFocus(f)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                  focus === f
                    ? 'bg-sky-600/30 border-sky-500/60 text-sky-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Special Requests{' '}
            <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder='e.g. "no fly today, shoulder is sore" or "include block starts with bands"'
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <button
          onClick={() => void handleGenerate()}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
        >
          <Zap size={16} />
          {loading ? 'Generating...' : 'Generate Session'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-950/40 border border-red-700/40 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm text-red-300">{error}</p>
            {rawError && (
              <pre className="mt-2 text-xs text-red-400/70 bg-red-950/40 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap">
                {rawError}
              </pre>
            )}
          </div>
        </div>
      )}

      {loading && <LoadingSpinner label={`Generating your ${focus} session...`} />}

      {session && !loading && (
        <SessionView
          session={session}
          onSave={handleSave}
          onRefine={handleRefine}
          isRefining={refining}
          saved={saved}
        />
      )}
    </div>
  );
}
