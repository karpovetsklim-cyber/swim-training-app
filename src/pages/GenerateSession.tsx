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

const INPUT_CLS =
  'w-full bg-slate-900 border border-slate-700/40 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500/60 focus:ring-1 focus:ring-slate-500/10';

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
      setError(err instanceof Error ? err.message : String(err));
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
      {/* Page header */}
      <div>
        <p className="font-mono text-[10px] text-slate-600 uppercase tracking-[0.2em] mb-1">AI Coach</p>
        <h1 className="text-3xl font-extralight text-slate-100 tracking-wide">Generate Session</h1>
        <p className="text-sm text-slate-500 mt-1">Pick a focus and let the AI build your workout.</p>
      </div>

      {/* Generator form */}
      <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 backdrop-blur-sm p-5 space-y-5">
        {/* Focus selector */}
        <div>
          <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-3">Session Focus</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SESSION_FOCUSES.map((f) => (
              <button
                key={f}
                onClick={() => setFocus(f)}
                className={`px-3 py-2.5 rounded-lg text-sm border transition-all duration-200 text-left ${
                  focus === f
                    ? 'border-slate-500/60 text-slate-100 bg-slate-800/60'
                    : 'border-slate-800/50 text-slate-500 hover:border-slate-700/60 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Special requests */}
        <div>
          <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-2">
            Notes <span className="text-slate-700">— optional</span>
          </p>
          <input
            type="text"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder='e.g. "no fly today, shoulder is sore" or "include block starts"'
            className={INPUT_CLS}
          />
        </div>

        {/* CTA */}
        <button
          onClick={() => void handleGenerate()}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-white disabled:bg-slate-800 disabled:opacity-40 text-slate-950 font-medium rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
        >
          <Zap size={15} />
          {loading ? 'Generating...' : 'Generate Session'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 border border-red-900/40 bg-red-950/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500/70 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm text-red-400/80">{error}</p>
            {rawError && (
              <pre className="mt-2 text-xs text-red-400/50 bg-red-950/30 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap">
                {rawError}
              </pre>
            )}
          </div>
        </div>
      )}

      {loading && <LoadingSpinner label={`Building ${focus} session...`} />}

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
