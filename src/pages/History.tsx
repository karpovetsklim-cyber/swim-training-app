import { useState } from 'react';
import { Trash2, Zap, Calendar, Search, Filter } from 'lucide-react';
import { getWorkouts, deleteWorkout, saveSession, saveWeeklyPlan } from '../lib/storage';
import { SessionView } from '../components/session/SessionView';
import { WeeklyPlanView } from '../components/weekly/WeeklyPlanView';
import type { SavedWorkout, Session, WeeklyPlan } from '../types';

type FilterType = 'all' | 'session' | 'weekly_plan';

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
    const matchSearch =
      !search ||
      w.label.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">History</h1>
        <p className="text-gray-400 text-sm">All your saved workouts.</p>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No saved workouts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Sidebar list */}
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="relative">
                <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-sky-500 appearance-none"
                >
                  <option value="all">All</option>
                  <option value="session">Sessions</option>
                  <option value="weekly_plan">Weekly Plans</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-gray-500">{filtered.length} results</p>

            {/* List */}
            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
              {filtered.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelected(w)}
                  className={`group w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                    selected?.id === w.id
                      ? 'bg-sky-900/30 border-sky-600/40'
                      : 'bg-gray-800/40 border-gray-700/40 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs ${
                        w.type === 'session'
                          ? 'bg-sky-900/60 text-sky-400'
                          : 'bg-violet-900/60 text-violet-400'
                      }`}
                    >
                      {w.type === 'session' ? <Zap size={11} /> : <Calendar size={11} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{w.label}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(w.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(w.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-900/40 text-gray-600 hover:text-red-400 shrink-0"
                    title="Delete"
                  >
                    <Trash2 size={13} />
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
              <div className="text-center py-20 text-gray-600">
                <p className="text-sm">Select a workout to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
