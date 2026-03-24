import { useState } from 'react';
import { Pencil, Check, X, Zap, Clock, Wrench, Lightbulb } from 'lucide-react';
import type { SwimSet } from '../../types';

const EFFORT_COLORS: Record<string, string> = {
  Easy: 'bg-green-900/40 text-green-300 border-green-700/40',
  Moderate: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  Strong: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  Fast: 'bg-orange-900/40 text-orange-300 border-orange-700/40',
  MAX: 'bg-red-900/40 text-red-300 border-red-700/40',
};

function EffortBadge({ effort }: { effort: string }) {
  const cls = EFFORT_COLORS[effort] ?? 'bg-gray-800 text-gray-300 border-gray-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      <Zap size={11} />
      {effort}
    </span>
  );
}

interface SetCardProps {
  set: SwimSet;
  index: number;
  onUpdate: (updated: SwimSet) => void;
}

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
      <div className="bg-gray-800/60 rounded-lg border border-sky-500/40 p-4 space-y-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-sky-400 font-medium uppercase tracking-wider">Editing</span>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs"
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs"
            >
              <X size={12} /> Cancel
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
            ['techniqueCue', 'Technique Cue', 'textarea'],
          ] as [keyof SwimSet, string, string][]
        ).map(([field, label, type]) => (
          <div key={field}>
            <label className="block text-xs text-gray-400 mb-1">{label}</label>
            {type === 'textarea' ? (
              <textarea
                value={(draft[field] as string) ?? ''}
                onChange={(e) => setDraft({ ...draft, [field]: e.target.value || null })}
                rows={2}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-sky-500 resize-none"
              />
            ) : (
              <input
                type="text"
                value={(draft[field] as string) ?? ''}
                onChange={(e) => setDraft({ ...draft, [field]: e.target.value || null })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-sky-500"
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="group bg-gray-800/40 hover:bg-gray-800/60 rounded-lg border border-gray-700/50 p-4 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h4 className="font-semibold text-white text-sm">{set.name}</h4>
            {set.effort && <EffortBadge effort={set.effort} />}
            {set.volumeM > 0 && (
              <span className="text-xs text-gray-500">{set.volumeM}m</span>
            )}
          </div>

          <p className="text-gray-300 text-sm leading-relaxed">{set.description}</p>

          <div className="flex flex-wrap gap-3 mt-2">
            {set.rest && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} className="shrink-0" /> {set.rest}
              </span>
            )}
            {set.equipment && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Wrench size={11} className="shrink-0" /> {set.equipment}
              </span>
            )}
          </div>

          {set.techniqueCue && (
            <div className="mt-2 flex items-start gap-1.5 bg-sky-950/40 border border-sky-800/30 rounded px-3 py-2">
              <Lightbulb size={13} className="text-sky-400 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-300 leading-relaxed">{set.techniqueCue}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => { setDraft(set); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 shrink-0"
          title="Edit set"
        >
          <Pencil size={14} />
        </button>
      </div>
    </div>
  );
}
