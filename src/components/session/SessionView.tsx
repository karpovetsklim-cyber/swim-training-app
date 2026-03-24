import { useState } from 'react';
import { Save, FileText, FileDown, Sparkles, RefreshCw } from 'lucide-react';
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

const GHOST_BTN = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/50 text-slate-400 hover:border-slate-600/60 hover:text-slate-200 text-xs font-mono tracking-wide uppercase transition-all duration-200';

export function SessionView({ session, onSave, onRefine, isRefining, saved }: SessionViewProps) {
  const [currentSession, setCurrentSession] = useState<Session>(session);
  const [refineText, setRefineText] = useState('');
  const [showRefine, setShowRefine] = useState(false);

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
      <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 backdrop-blur-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            {/* Day label */}
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1">
              {currentSession.day} · {currentSession.energySystem}
            </p>
            {/* Focus heading */}
            <h2 className="text-2xl font-extralight text-slate-100 tracking-wide">
              {currentSession.focus}
            </h2>
            {/* Volume */}
            <p className="font-mono text-3xl font-light text-slate-300 mt-1">
              {currentSession.totalVolumeM.toLocaleString()}
              <span className="text-base text-slate-500 ml-1">m</span>
            </p>
            {currentSession.specialRequests && (
              <p className="text-xs text-slate-600 mt-2 italic">
                {currentSession.specialRequests}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRefine(!showRefine)}
              disabled={!onRefine || isRefining}
              className={`${GHOST_BTN} disabled:opacity-30`}
            >
              <Sparkles size={12} /> Refine
            </button>
            <button onClick={() => exportSessionMarkdown(currentSession)} className={GHOST_BTN}>
              <FileText size={12} /> .md
            </button>
            <button onClick={() => exportSessionPDF(currentSession)} className={GHOST_BTN}>
              <FileDown size={12} /> PDF
            </button>
            {onSave && (
              <button
                onClick={() => onSave(currentSession)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide uppercase transition-all duration-200 ${
                  saved
                    ? 'border border-emerald-800/50 text-emerald-400/70'
                    : 'bg-slate-100 hover:bg-white text-slate-900 font-medium'
                }`}
              >
                <Save size={12} /> {saved ? 'Saved' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* AI Refine input */}
        {showRefine && (
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <p className="font-mono text-[10px] text-slate-600 uppercase tracking-widest mb-2">
              Describe the change
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleRefine()}
                placeholder='e.g. "make the main set longer" or "reduce volume to 2800m"'
                className="flex-1 bg-slate-900 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500/50"
              />
              <button
                onClick={() => void handleRefine()}
                disabled={!refineText.trim() || isRefining}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-white disabled:opacity-30 text-slate-900 rounded-lg text-xs font-medium transition-all"
              >
                {isRefining ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Refine
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {isRefining && (
        <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 p-6">
          <LoadingSpinner label="Refining session..." />
        </div>
      )}

      {/* Sets */}
      {!isRefining && (
        <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 backdrop-blur-sm px-4 py-2">
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
