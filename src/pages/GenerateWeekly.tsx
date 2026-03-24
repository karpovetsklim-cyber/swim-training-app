import { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { WeeklyPlanView } from '../components/weekly/WeeklyPlanView';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { generateWeeklyPlan, refineWeeklyPlan } from '../lib/claude';
import { getProfile, getSettings, saveWeeklyPlan } from '../lib/storage';
import type { WeeklyPlan, TrainingPhase } from '../types';

const PHASES: { value: TrainingPhase; label: string; description: string }[] = [
  { value: 'BASE', label: 'Base', description: 'Aerobic foundation, higher volume' },
  { value: 'BUILD', label: 'Build', description: 'Progressive intensity, race prep' },
  { value: 'TAPER', label: 'Taper', description: 'Volume drop, maintain speed' },
  { value: 'RECOVERY', label: 'Recovery', description: 'Easy, technique-focused' },
];

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
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Generate Weekly Plan</h1>
        <p className="text-gray-400 text-sm">Full Mon–Sat training week tailored to your phase.</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Training Phase</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PHASES.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => setPhase(value)}
                className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-lg text-left border transition-colors ${
                  phase === value
                    ? 'bg-violet-600/30 border-violet-500/60 text-violet-200'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs opacity-70">{description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Context <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder='e.g. "competition in 2 weeks" or "coming back from a week off"'
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <button
          onClick={() => void handleGenerate()}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
        >
          <Calendar size={16} />
          {loading ? 'Generating week...' : 'Generate Weekly Plan'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-950/40 border border-red-700/40 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {loading && <LoadingSpinner label={`Generating your ${phase} training week...`} />}

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
