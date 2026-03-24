import { useState } from 'react';
import { Pencil, Check, X, Clock, Wrench } from 'lucide-react';
import type { SwimSet } from '../../types';

// Effort styles: intentionally muted to fit the slate palette
const EFFORT_STYLES: Record<string, string> = {
  Easy:     'text-emerald-400/70 border-emerald-900/60',
  Moderate: 'text-sky-400/60 border-sky-900/50',
  Strong:   'text-amber-400/60 border-amber-900/50',
  Fast:     'text-orange-400/70 border-orange-900/60',
  MAX:      'text-white border-slate-400/40 shadow-[0_0_8px_rgba(255,255,255,0.08)]',
};

function EffortBadge({ effort }: { effort: string }) {
  const cls = EFFORT_STYLES[effort] ?? 'text-slate-400 border-slate-700/40';
  return (
    <span className={`font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded border ${cls}`}>
      {effort}
    </span>
  );
}

interface SetCardProps {
  set: SwimSet;
  index: number;
  onUpdate: (updated: SwimSet) => void;
}

const INPUT_CLS =
  'w-full bg-slate-950 border border-slate-700/40 rounded px-2.5 py-1.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500/60 focus:ring-1 focus:ring-slate-500/10';

export function SetCard({ set, onUpdate }: SetCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(set);

  function handleSave() {
    onUpdate(draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(set);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="border border-slate-600/40 bg-slate-900/60 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Editing</span>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-white text-slate-900 rounded text-xs font-medium"
            >
              <Check size={11} /> Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2.5 py-1 border border-slate-700/50 text-slate-400 hover:text-slate-200 rounded text-xs"
            >
              <X size={11} /> Cancel
            </button>
          </div>
        </div>

        {(
          [
            ['name', 'Set Name', 'text'],
            ['description', 'Description', 'textarea'],
            ['effort', 'Effort', 'text'],
            ['rest', 'Rest', 'text'],
            ['equipment', 'Equipment', 'text'],
            ['techniqueCue', 'Technique Cue', 'text'],
          ] as [keyof SwimSet, string, string][]
        ).map(([field, label, type]) => (
          <div key={field}>
            <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              {label}
            </label>
            {type === 'textarea' ? (
              <textarea
                value={(draft[field] as string) ?? ''}
                onChange={(e) => setDraft({ ...draft, [field]: e.target.value || null })}
                rows={2}
                className={INPUT_CLS + ' resize-none'}
              />
            ) : (
              <input
                type="text"
                value={(draft[field] as string) ?? ''}
                onChange={(e) => setDraft({ ...draft, [field]: e.target.value || null })}
                className={INPUT_CLS}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="group border-b border-slate-800/50 last:border-b-0 py-3.5 px-1 hover:bg-slate-900/30 transition-all duration-200 rounded">
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* Set name — fixed width, mono uppercase label */}
        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider w-20 shrink-0 pt-0.5 leading-tight">
          {set.name}
        </span>

        {/* Description */}
        <p className="flex-1 text-sm text-slate-200 leading-snug min-w-0">
          {set.description}
        </p>

        {/* Meta row — right side */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {set.effort && <EffortBadge effort={set.effort} />}
          {set.rest && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-600">
              <Clock size={10} /> {set.rest}
            </span>
          )}
          {set.volumeM > 0 && (
            <span className="font-mono text-[10px] text-slate-600">{set.volumeM}m</span>
          )}
          {set.equipment && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-600">
              <Wrench size={10} />
            </span>
          )}
          <button
            onClick={() => { setDraft(set); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-800 text-slate-600 hover:text-slate-300 shrink-0"
            title="Edit set"
          >
            <Pencil size={12} />
          </button>
        </div>
      </div>

      {/* Technique cue — subtle italic line */}
      {set.techniqueCue && (
        <p className="ml-[92px] mt-1 text-xs text-slate-500 italic leading-snug">
          › {set.techniqueCue}
        </p>
      )}

      {/* Equipment detail — if present, shown as small tag */}
      {set.equipment && (
        <p className="ml-[92px] mt-0.5 font-mono text-[10px] text-slate-600 uppercase tracking-wider">
          {set.equipment}
        </p>
      )}
    </div>
  );
}
