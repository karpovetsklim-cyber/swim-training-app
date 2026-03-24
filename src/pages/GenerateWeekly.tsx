import { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { WeeklyPlanView } from '../components/weekly/WeeklyPlanView';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { generateWeeklyPlan, refineWeeklyPlan } from '../lib/claude';
import { getProfile, getSettings, saveWeeklyPlan } from '../lib/storage';
import type { WeeklyPlan, TrainingPhase } from '../types';

const PHASES: { value: TrainingPhase; label: string; description: string }[] = [
  { value: 'BASE',     label: 'Base',     description: 'Aerobic foundation, higher volume' },
  { value: 'BUILD',    label: 'Build',    description: 'Progressive intensity, race prep' },
  { value: 'TAPER',    label: 'Taper',    description: 'Volume drop, maintain speed' },
  { value: 'RECOVERY', label: 'Recovery', description: 'Easy, technique-focused' },
];

const INPUT_CLS =
  'w-full bg-slate-900 border border-slate-700/40 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500/60 focus:ring-1 focus:ring-slate-500/10';

export function GenerateWeekly() {
  const [phase, setPhase] = useState<TrainingPhase>('BUILD');
  const [context, setContext] = useState('');
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const settings = getSettings();
  const profile = getProfile();

  async function handleGenerate() {
    if (!settings.apiKey) {
      setError('No API key set. Please add your Anthropic API key in Settings.');
      return;
    }
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const result = await generateWeeklyPlan(
        settings.apiKey,
        settings.model,
        profile,
        phase,
        context || undefined,
      );
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRefine(instruction: string) {
    if (!plan || !settings.apiKey) return;
    setRefining(true);
    setError(null);
    try {
      const result = await refineWeeklyPlan(settings.apiKey, settings.model, profile, plan, instruction);
      setPlan(result);
      setSaved(false);
    } catch (err) {
      setError('Refinement failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRefining(false);
    }
  }

  function handleSave(p: WeeklyPlan) {
    saveWeeklyPlan(p);
    setSaved(true);
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page header */}
      <div>
        <p className="font-mono text-[10px] text-slate-600 uppercase tracking-[0.2em] mb-1">AI Coach</p>
        <h1 className="text-3xl font-extralight text-slate-100 tracking-wide">Generate Weekly Plan</h1>
        <p className="text-sm text-slate-500 mt-1">Full Mon–Sat training week tailored to your phase.</p>
      </div>

      {/* Form */}
      <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 backdrop-blur-sm p-5 space-y-5">
        {/* Phase selector */}
        <div>
          <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-3">Training Phase</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PHASES.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => setPhase(value)}
                className={`flex flex-col gap-1 px-3 py-3 rounded-lg text-left border transition-all duration-200 ${
                  phase === value
                    ? 'border-slate-500/60 bg-slate-800/60'
                    : 'border-slate-800/50 hover:border-slate-700/60'
                }`}
              >
                <span className={`text-sm font-light ${phase === value ? 'text-slate-100' : 'text-slate-400'}`}>
                  {label}
                </span>
                <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider leading-snug">
                  {description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Context */}
        <div>
          <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-2">
            Context <span className="text-slate-700">— optional</span>
          </p>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder='e.g. "competition in 2 weeks" or "coming back from a week off"'
            className={INPUT_CLS}
          />
        </div>

        {/* CTA */}
        <button
          onClick={() => void handleGenerate()}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-white disabled:bg-slate-800 disabled:opacity-40 text-slate-950 font-medium rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
        >
          <Calendar size={15} />
          {loading ? 'Generating week...' : 'Generate Weekly Plan'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 border border-red-900/40 bg-red-950/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500/70 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400/80">{error}</p>
        </div>
      )}

      {loading && <LoadingSpinner label={`Building ${phase} training week...`} />}

      {plan && !loading && (
        <WeeklyPlanView
          plan={plan}
          onSave={handleSave}
          onRefine={handleRefine}
          isRefining={refining}
          saved={saved}
        />
      )}
    </div>
  );
}
