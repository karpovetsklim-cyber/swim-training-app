import { useState } from 'react';
import { Trash2, Zap, Calendar, Search, Filter } from 'lucide-react';
import { getWorkouts, deleteWorkout, saveSession, saveWeeklyPlan } from '../lib/storage';
import { SessionView } from '../components/session/SessionView';
import { WeeklyPlanView } from '../components/weekly/WeeklyPlanView';
import type { SavedWorkout, Session, WeeklyPlan } from '../types';

type FilterType = 'all' | 'session' | 'weekly_plan';

const INPUT_CLS =
  'bg-slate-900 border border-slate-700/40 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500/60 transition-colors';

export function History() {
  const [workouts, setWorkouts] = useState<SavedWorkout[]>(getWorkouts);
  const [selected, setSelected] = useState<SavedWorkout | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteWorkout(id);
    setWorkouts(getWorkouts());
    if (selected?.id === id) setSelected(null);
  }

  function handleResave(workout: SavedWorkout) {
    if (workout.type === 'session') {
      saveSession(workout.data as Session);
    } else {
      saveWeeklyPlan(workout.data as WeeklyPlan);
    }
    setWorkouts(getWorkouts());
  }

  const filtered = workouts.filter((w) => {
    const matchType = filterType === 'all' || w.type === filterType;
    const matchSearch = !search || w.label.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="font-mono text-[10px] text-slate-600 uppercase tracking-[0.2em] mb-1">Archive</p>
        <h1 className="text-3xl font-extralight text-slate-100 tracking-wide">History</h1>
        <p className="text-sm text-slate-500 mt-1">All your saved workouts.</p>
      </div>

      {workouts.length === 0 ? (
        <div className="border border-slate-800/40 rounded-xl text-center py-24">
          <Calendar size={28} className="mx-auto text-slate-700 mb-3" />
          <p className="text-sm text-slate-600">No saved workouts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* Sidebar list */}
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className={`${INPUT_CLS} w-full pl-8 pr-3 py-2`}
                />
              </div>
              <div className="relative">
                <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className={`${INPUT_CLS} pl-8 pr-3 py-2 appearance-none`}
                >
                  <option value="all">All</option>
                  <option value="session">Sessions</option>
                  <option value="weekly_plan">Weekly</option>
                </select>
              </div>
            </div>

            <p className="font-mono text-[10px] text-slate-700 uppercase tracking-widest">
              {filtered.length} results
            </p>

            {/* List */}
            <div className="space-y-1 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
              {filtered.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelected(w)}
                  className={`group w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200 text-left ${
                    selected?.id === w.id
                      ? 'border-slate-600/50 bg-slate-800/50'
                      : 'border-slate-800/40 hover:border-slate-700/50 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded border border-slate-800/60 text-slate-500">
                      {w.type === 'session' ? <Zap size={10} /> : <Calendar size={10} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">{w.label}</p>
                      <p className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">
                        {new Date(w.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(w.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-950/30 text-slate-700 hover:text-red-500/70 shrink-0"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
              ))}
            </div>
          </div>

          {/* Detail view */}
          <div>
            {selected ? (
              selected.type === 'session' ? (
                <SessionView
                  session={selected.data as Session}
                  onSave={() => handleResave(selected)}
                />
              ) : (
                <WeeklyPlanView
                  plan={selected.data as WeeklyPlan}
                  onSave={() => handleResave(selected)}
                />
              )
            ) : (
              <div className="border border-slate-800/40 rounded-xl text-center py-24">
                <p className="font-mono text-[10px] text-slate-700 uppercase tracking-widest">
                  Select a workout to view
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
