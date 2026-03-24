import { useState } from 'react';
import { Check, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { getProfile, saveProfile, getSettings, saveSettings } from '../lib/storage';
import type { AthleteProfile, AppSettings } from '../types';

const EQUIPMENT_OPTIONS = [
  'short_fins',
  'long_fins',
  'hand_paddles',
  'pull_buoy',
  'kickboard',
  'resistance_bands_block',
  'snorkel',
  'tempo_trainer',
];

const MODELS = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (recommended)' },
  { value: 'claude-opus-4-6',   label: 'Claude Opus 4.6 (most capable, slower)' },
  { value: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5 (fastest, cheapest)' },
];

const INPUT_CLS =
  'w-full bg-slate-900 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500/60 focus:ring-1 focus:ring-slate-500/10';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-4">{children}</p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Settings() {
  const [profile, setProfile] = useState<AthleteProfile>(getProfile);
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [showKey, setShowKey] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [newEvent, setNewEvent] = useState({ key: '', bestTimeS: 0, priority: 'A' as 'A' | 'B' | 'C' });

  function handleSaveProfile() {
    saveProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  function handleSaveSettings() {
    saveSettings(settings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  function toggleEquipment(eq: string) {
    const has = profile.equipment.includes(eq);
    setProfile({
      ...profile,
      equipment: has ? profile.equipment.filter((e) => e !== eq) : [...profile.equipment, eq],
    });
  }

  function addEvent() {
    if (!newEvent.key.trim()) return;
    const key = newEvent.key.trim().toLowerCase().replace(/\s+/g, '_');
    setProfile({
      ...profile,
      events: { ...profile.events, [key]: { bestTimeS: newEvent.bestTimeS, priority: newEvent.priority } },
    });
    setNewEvent({ key: '', bestTimeS: 0, priority: 'A' });
  }

  function removeEvent(key: string) {
    const events = { ...profile.events };
    delete events[key];
    setProfile({ ...profile, events });
  }

  const SAVE_BTN = (saved: boolean) =>
    `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      saved
        ? 'border border-emerald-800/50 text-emerald-400/70'
        : 'bg-slate-100 hover:bg-white text-slate-900 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)]'
    }`;

  return (
    <div className="max-w-2xl space-y-8">
      {/* Page header */}
      <div>
        <p className="font-mono text-[10px] text-slate-600 uppercase tracking-[0.2em] mb-1">Configuration</p>
        <h1 className="text-3xl font-extralight text-slate-100 tracking-wide">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile and API configuration.</p>
      </div>

      {/* API Settings */}
      <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 backdrop-blur-sm p-5 space-y-4">
        <SectionTitle>API Configuration</SectionTitle>

        <Field label="Anthropic API Key">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="sk-ant-..."
              className={INPUT_CLS + ' pr-10'}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="font-mono text-[10px] text-slate-700 uppercase tracking-wider mt-1.5">
            Stored locally · never sent anywhere except Anthropic
          </p>
        </Field>

        <Field label="Model">
          <select
            value={settings.model}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            className={INPUT_CLS}
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </Field>

        <button onClick={handleSaveSettings} className={SAVE_BTN(settingsSaved)}>
          {settingsSaved ? <><Check size={13} /> Saved</> : 'Save Settings'}
        </button>
      </div>

      {/* Athlete Profile */}
      <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 backdrop-blur-sm p-5 space-y-4">
        <SectionTitle>Athlete Profile</SectionTitle>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Age">
            <input
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: +e.target.value })}
              className={INPUT_CLS}
            />
          </Field>
        </div>

        <Field label="Level">
          <select
            value={profile.level}
            onChange={(e) => setProfile({ ...profile, level: e.target.value })}
            className={INPUT_CLS}
          >
            <option value="beginner">Beginner</option>
            <option value="recreational">Recreational</option>
            <option value="competitive_club">Competitive Club</option>
            <option value="competitive_regional">Competitive Regional</option>
            <option value="competitive_national">Competitive National</option>
            <option value="elite">Elite</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Pool Length (m)">
            <input
              type="number"
              value={profile.poolLengthM}
              onChange={(e) => setProfile({ ...profile, poolLengthM: +e.target.value })}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Sessions / Week">
            <input
              type="number"
              value={profile.sessionsPerWeek}
              onChange={(e) => setProfile({ ...profile, sessionsPerWeek: +e.target.value })}
              className={INPUT_CLS}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Min Volume (m)">
            <input
              type="number"
              value={profile.sessionVolumeRange.min}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  sessionVolumeRange: { ...profile.sessionVolumeRange, min: +e.target.value },
                })
              }
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Max Volume (m)">
            <input
              type="number"
              value={profile.sessionVolumeRange.max}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  sessionVolumeRange: { ...profile.sessionVolumeRange, max: +e.target.value },
                })
              }
              className={INPUT_CLS}
            />
          </Field>
        </div>

        <Field label="Training Context">
          <textarea
            value={profile.trainingContext}
            onChange={(e) => setProfile({ ...profile, trainingContext: e.target.value })}
            rows={2}
            className={INPUT_CLS + ' resize-none'}
          />
        </Field>

        {/* Equipment */}
        <Field label="Equipment">
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((eq) => {
              const active = profile.equipment.includes(eq);
              return (
                <button
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  className={`font-mono text-[10px] px-2.5 py-1.5 rounded border uppercase tracking-wider transition-all duration-200 ${
                    active
                      ? 'border-slate-500/60 text-slate-200 bg-slate-800/60'
                      : 'border-slate-800/50 text-slate-600 hover:border-slate-700/60 hover:text-slate-400'
                  }`}
                >
                  {eq.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Events */}
        <Field label="Race Events">
          <div className="space-y-2">
            {Object.entries(profile.events).map(([key, data]) => (
              <div key={key} className="flex items-center gap-2 border border-slate-800/50 rounded-lg px-3 py-2 bg-slate-900/40">
                <span className="flex-1 text-sm text-slate-300">{key.replace(/_/g, ' ')}</span>
                <input
                  type="number"
                  value={data.bestTimeS}
                  step="0.1"
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      events: { ...profile.events, [key]: { ...data, bestTimeS: +e.target.value } },
                    })
                  }
                  className="w-20 bg-slate-800 border border-slate-700/40 rounded px-2 py-1 font-mono text-xs text-slate-100 focus:outline-none focus:border-slate-500/60"
                />
                <span className="font-mono text-[10px] text-slate-600">s</span>
                <select
                  value={data.priority}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      events: { ...profile.events, [key]: { ...data, priority: e.target.value as 'A' | 'B' | 'C' } },
                    })
                  }
                  className="bg-slate-800 border border-slate-700/40 rounded px-2 py-1 font-mono text-xs text-slate-100 focus:outline-none"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
                <button
                  onClick={() => removeEvent(key)}
                  className="text-slate-700 hover:text-red-500/70 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* Add new event */}
            <div className="flex items-center gap-2 border border-dashed border-slate-800/60 rounded-lg px-3 py-2">
              <input
                type="text"
                value={newEvent.key}
                onChange={(e) => setNewEvent({ ...newEvent, key: e.target.value })}
                placeholder="e.g. 200_back"
                className="flex-1 bg-transparent text-xs text-slate-400 placeholder-slate-700 focus:outline-none"
              />
              <input
                type="number"
                value={newEvent.bestTimeS || ''}
                step="0.1"
                onChange={(e) => setNewEvent({ ...newEvent, bestTimeS: +e.target.value })}
                placeholder="time"
                className="w-16 bg-slate-800 border border-slate-700/40 rounded px-2 py-1 font-mono text-xs text-slate-100 focus:outline-none"
              />
              <span className="font-mono text-[10px] text-slate-600">s</span>
              <select
                value={newEvent.priority}
                onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as 'A' | 'B' | 'C' })}
                className="bg-slate-800 border border-slate-700/40 rounded px-2 py-1 font-mono text-xs text-slate-100 focus:outline-none"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
              <button
                onClick={addEvent}
                className="text-slate-500 hover:text-slate-200 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </Field>

        <button onClick={handleSaveProfile} className={SAVE_BTN(profileSaved)}>
          {profileSaved ? <><Check size={13} /> Saved</> : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
