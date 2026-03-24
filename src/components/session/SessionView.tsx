import { useState } from 'react';
import { Save, FileText, FileDown, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { SetCard } from './SetCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { exportSessionMarkdown, exportSessionPDF } from '../../lib/export';
import type { Session, SwimSet } from '../../types';

interface SessionViewProps {
  session: Session;
  onSave?: (session: Session) => void;
  onRefine?: (instruction: string) => Promise<void>;
  isRefining?: boolean;
  saved?: boolean;
}

export function SessionView({ session, onSave, onRefine, isRefining, saved }: SessionViewProps) {
  const [currentSession, setCurrentSession] = useState<Session>(session);
  const [refineText, setRefineText] = useState('');
  const [showRefine, setShowRefine] = useState(false);

  // Sync when parent passes a new session (after refine)
  if (session !== currentSession && !isRefining) {
    setCurrentSession(session);
  }

  function handleSetUpdate(index: number, updated: SwimSet) {
    const sets = [...currentSession.sets];
    sets[index] = updated;
    const recalc = sets.reduce((sum, s) => sum + s.volumeM, 0);
    setCurrentSession({ ...currentSession, sets, totalVolumeM: recalc });
  }

  async function handleRefine() {
    if (!refineText.trim() || !onRefine) return;
    await onRefine(refineText.trim());
    setRefineText('');
    setShowRefine(false);
  }

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white">
              {currentSession.day}: {currentSession.focus}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400 flex-wrap">
              <span>{currentSession.energySystem}</span>
              <ChevronRight size={14} />
              <span className="text-sky-400 font-semibold text-base">
                {currentSession.totalVolumeM}m
              </span>
            </div>
            {currentSession.specialRequests && (
              <p className="text-xs text-gray-500 mt-1">
                Notes: {currentSession.specialRequests}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRefine(!showRefine)}
              disabled={!onRefine || isRefining}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-800/40 hover:bg-violet-700/50 text-violet-300 text-sm border border-violet-700/40 transition-colors disabled:opacity-40"
            >
              <Sparkles size={14} /> AI Refine
            </button>
            <button
              onClick={() => exportSessionMarkdown(currentSession)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm border border-gray-700 transition-colors"
            >
              <FileText size={14} /> .md
            </button>
            <button
              onClick={() => exportSessionPDF(currentSession)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm border border-gray-700 transition-colors"
            >
              <FileDown size={14} /> PDF
            </button>
            {onSave && (
              <button
                onClick={() => onSave(currentSession)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  saved
                    ? 'bg-green-900/40 text-green-300 border-green-700/40'
                    : 'bg-sky-700/40 hover:bg-sky-600/50 text-sky-300 border-sky-600/40'
                }`}
              >
                <Save size={14} /> {saved ? 'Saved!' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* AI Refine input */}
        {showRefine && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-400 mb-2">
              Describe what you want to change. The AI will regenerate the session.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleRefine()}
                placeholder='e.g. "make the main set longer" or "reduce volume to 2800m"'
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={() => void handleRefine()}
                disabled={!refineText.trim() || isRefining}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
              >
                {isRefining ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Refine
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay during refine */}
      {isRefining && (
        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-6">
          <LoadingSpinner label="AI is refining your session..." />
        </div>
      )}

      {/* Sets */}
      {!isRefining && (
        <div className="space-y-2">
          {currentSession.sets.map((set, i) => (
            <SetCard
              key={`${currentSession.id}-${i}`}
              set={set}
              index={i}
              onUpdate={(updated) => handleSetUpdate(i, updated)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
