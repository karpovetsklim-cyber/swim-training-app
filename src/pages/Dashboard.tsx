import { Link } from 'react-router-dom';
import { Zap, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { getWorkouts, getProfile, getSettings } from '../lib/storage';
import type { SavedWorkout } from '../types';

function RecentCard({ workout }: { workout: SavedWorkout }) {
  const isSession = workout.type === 'session';
  const to = `/history`;

  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg px-4 py-3 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs ${
            isSession
              ? 'bg-sky-900/60 text-sky-400'
              : 'bg-violet-900/60 text-violet-400'
          }`}
        >
          {isSession ? <Zap size={13} /> : <Calendar size={13} />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{workout.label}</p>
          <p className="text-xs text-gray-500">
            {new Date(workout.savedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-xs text-gray-600">
        {isSession ? 'session' : 'week'}
      </span>
    </Link>
  );
}

export function Dashboard() {
  const workouts = getWorkouts().slice(0, 8);
  const profile = getProfile();
  const settings = getSettings();
  const hasKey = !!settings.apiKey;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Quick actions + recent */}
      <div className="lg:col-span-2 space-y-6">
        {!hasKey && (
          <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-700/40 rounded-xl px-4 py-3">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">API key required</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Add your Anthropic API key in{' '}
                <Link to="/settings" className="underline">
                  Settings
                </Link>{' '}
                to generate workouts.
              </p>
            </div>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Good swim, {profile.name}.</h1>
          <p className="text-gray-400 text-sm">What are we working on today?</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/session"
            className="group flex flex-col gap-3 bg-gradient-to-br from-sky-900/40 to-sky-800/20 hover:from-sky-900/60 hover:to-sky-800/40 border border-sky-700/30 hover:border-sky-600/50 rounded-xl p-5 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-600/30 flex items-center justify-center group-hover:bg-sky-600/50 transition-colors">
              <Zap className="text-sky-300" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Generate Session</h3>
              <p className="text-sm text-gray-400 mt-0.5">One complete workout, built by AI</p>
            </div>
          </Link>

          <Link
            to="/weekly"
            className="group flex flex-col gap-3 bg-gradient-to-br from-violet-900/40 to-violet-800/20 hover:from-violet-900/60 hover:to-violet-800/40 border border-violet-700/30 hover:border-violet-600/50 rounded-xl p-5 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-violet-600/30 flex items-center justify-center group-hover:bg-violet-600/50 transition-colors">
              <Calendar className="text-violet-300" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Generate Weekly Plan</h3>
              <p className="text-sm text-gray-400 mt-0.5">Full Mon–Sat training week</p>
            </div>
          </Link>
        </div>

        {/* Recent workouts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Recent Workouts</h2>
            {workouts.length > 0 && (
              <Link to="/history" className="text-xs text-sky-400 hover:text-sky-300">
                View all
              </Link>
            )}
          </div>

          {workouts.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
              <Clock className="mx-auto text-gray-600 mb-2" size={28} />
              <p className="text-gray-500 text-sm">No workouts saved yet</p>
              <p className="text-gray-600 text-xs mt-1">Generate your first session to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {workouts.map((w) => (
                <RecentCard key={w.id} workout={w} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Athlete profile card */}
      <div className="space-y-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Athlete</h2>
            <Link to="/settings" className="text-xs text-sky-400 hover:text-sky-300">
              Edit
            </Link>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-lg font-bold text-white">{profile.name}</p>
              <p className="text-sm text-gray-400">
                {profile.age} yo · {profile.level.replace(/_/g, ' ')}
              </p>
            </div>

            <div className="border-t border-gray-800 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pool</span>
                <span className="text-gray-300">{profile.poolLengthM}m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sessions/week</span>
                <span className="text-gray-300">{profile.sessionsPerWeek}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Volume range</span>
                <span className="text-gray-300">
                  {profile.sessionVolumeRange.min}–{profile.sessionVolumeRange.max}m
                </span>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-3">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Events</p>
              <div className="space-y-1.5">
                {Object.entries(profile.events).map(([event, data]) => (
                  <div key={event} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">
                      {event.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-white">{data.bestTimeS}s</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          data.priority === 'A'
                            ? 'bg-sky-900/50 text-sky-400'
                            : data.priority === 'B'
                            ? 'bg-gray-800 text-gray-400'
                            : 'bg-gray-900 text-gray-600'
                        }`}
                      >
                        {data.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-3">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Equipment</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.equipment.map((eq) => (
                  <span
                    key={eq}
                    className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full"
                  >
                    {eq.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
