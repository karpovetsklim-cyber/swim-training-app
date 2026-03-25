import { Link } from 'react-router-dom';
import { Zap, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { getWorkouts, getProfile, getSettings } from '../lib/storage';
import type { SavedWorkout } from '../types';
import ScrollExpandMedia from '../components/blocks/scroll-expansion-hero';

const BG_IMAGE = 'https://images.unsplash.com/photo-1530549387789-4c87e1c5c6aa?w=1920&q=80';
const HERO_IMAGE = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1000&q=80';

function RecentCard({ workout }: { workout: SavedWorkout }) {
  const isSession = workout.type === 'session';

  return (
    <Link
      to="/history"
      className="group flex items-center justify-between gap-3 border-b border-slate-800/40 last:border-b-0 py-3 px-1 hover:bg-slate-900/30 transition-all duration-200 rounded"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded font-mono text-[10px] border ${
          isSession
            ? 'border-slate-700/40 text-slate-400'
            : 'border-slate-700/40 text-slate-500'
        }`}>
          {isSession ? <Zap size={11} /> : <Calendar size={11} />}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-slate-200 truncate">{workout.label}</p>
          <p className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">
            {new Date(workout.savedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
      <span className="shrink-0 font-mono text-[10px] text-slate-700 uppercase tracking-wider">
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
    <ScrollExpandMedia
      mediaType="image"
      mediaSrc={HERO_IMAGE}
      bgImageSrc={BG_IMAGE}
      title="Ready to Train"
      scrollToExpand="Scroll to start"
    >
      {/* Dashboard content — shown after hero expands */}
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Quick actions + recent */}
          <div className="lg:col-span-2 space-y-6">
            {!hasKey && (
              <div className="flex items-start gap-3 border border-amber-900/40 bg-amber-950/20 rounded-xl px-4 py-3">
                <AlertTriangle size={16} className="text-amber-500/70 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-400/80">API key required</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Add your Anthropic API key in{' '}
                    <Link to="/settings" className="text-slate-400 hover:text-slate-200 underline underline-offset-2">
                      Settings
                    </Link>{' '}
                    to generate workouts.
                  </p>
                </div>
              </div>
            )}

            {/* Greeting */}
            <div>
              <p className="font-mono text-[10px] text-slate-600 uppercase tracking-[0.2em] mb-1">
                Welcome back
              </p>
              <h1 className="text-3xl font-extralight text-slate-100 tracking-wide">
                Good swim, {profile.name}.
              </h1>
              <p className="text-sm text-slate-500 mt-1">What are we working on today?</p>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/session"
                className="group relative overflow-hidden border border-slate-800/60 hover:border-slate-700/80 rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] bg-slate-900/30"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded border border-slate-700/40 flex items-center justify-center shrink-0 group-hover:border-slate-600/60 transition-colors">
                    <Zap className="text-slate-400 group-hover:text-slate-300" size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-light text-slate-100 tracking-wide">Generate Session</h3>
                    <p className="font-mono text-[10px] text-slate-600 uppercase tracking-wider mt-1">
                      One complete workout
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                to="/weekly"
                className="group relative overflow-hidden border border-slate-800/60 hover:border-slate-700/80 rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] bg-slate-900/30"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded border border-slate-700/40 flex items-center justify-center shrink-0 group-hover:border-slate-600/60 transition-colors">
                    <Calendar className="text-slate-400 group-hover:text-slate-300" size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-light text-slate-100 tracking-wide">Generate Weekly Plan</h3>
                    <p className="font-mono text-[10px] text-slate-600 uppercase tracking-wider mt-1">
                      Full Mon–Sat week
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Recent workouts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Recent</p>
                {workouts.length > 0 && (
                  <Link to="/history" className="font-mono text-[10px] text-slate-600 hover:text-slate-300 uppercase tracking-wider transition-colors">
                    View all
                  </Link>
                )}
              </div>

              {workouts.length === 0 ? (
                <div className="border border-slate-800/40 rounded-xl p-10 text-center">
                  <Clock className="mx-auto text-slate-700 mb-3" size={24} />
                  <p className="text-sm text-slate-600">No workouts saved yet</p>
                  <p className="font-mono text-[10px] text-slate-700 uppercase tracking-wider mt-1">
                    Generate your first session
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800/40 rounded-xl bg-slate-900/30 px-4 py-1">
                  {workouts.map((w) => (
                    <RecentCard key={w.id} workout={w} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Athlete profile card */}
          <div>
            <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Athlete</p>
                <Link
                  to="/settings"
                  className="font-mono text-[10px] text-slate-600 hover:text-slate-300 uppercase tracking-wider transition-colors"
                >
                  Edit
                </Link>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xl font-light text-slate-100">{profile.name}</p>
                  <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                    {profile.age} yo · {profile.level.replace(/_/g, ' ')}
                  </p>
                </div>

                <div className="border-t border-slate-800/50 pt-3 space-y-2.5">
                  {[
                    ['Pool', `${profile.poolLengthM}m`],
                    ['Sessions/week', String(profile.sessionsPerWeek)],
                    ['Volume range', `${profile.sessionVolumeRange.min}–${profile.sessionVolumeRange.max}m`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">{label}</span>
                      <span className="font-mono text-xs text-slate-300">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800/50 pt-3">
                  <p className="font-mono text-[10px] text-slate-600 uppercase tracking-widest mb-2">Events</p>
                  <div className="space-y-2">
                    {Object.entries(profile.events).map(([event, data]) => (
                      <div key={event} className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{event.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-200">{data.bestTimeS}s</span>
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                            data.priority === 'A'
                              ? 'border-slate-500/50 text-slate-300'
                              : data.priority === 'B'
                              ? 'border-slate-700/50 text-slate-500'
                              : 'border-slate-800/50 text-slate-700'
                          }`}>
                            {data.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800/50 pt-3">
                  <p className="font-mono text-[10px] text-slate-600 uppercase tracking-widest mb-2">Equipment</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.equipment.map((eq) => (
                      <span
                        key={eq}
                        className="font-mono text-[10px] border border-slate-800/60 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider"
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
      </div>
    </ScrollExpandMedia>
  );
}
