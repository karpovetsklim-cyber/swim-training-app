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
  { value: 'claude-opus-4-6', label: 'Claude Opus 4.6 (most capable, slower)' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fastest, cheapest)' },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{children}</h2>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const INPUT_CLS =
  'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-sky-500';

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
      events: {
        ...profile.events,
        [key]: { bestTimeS: newEvent.bestTimeS, priority: newEvent.priority },
      },
    });
    setNewEvent({ key: '', bestTimeS: 0, priority: 'A' });
  }

  function removeEvent(key: string) {
    const events = { ...profile.events };
    delete events[key];
    setProfile({ ...profile, events });
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-400 text-sm">Manage your profile and API configuration.</p>
      </div>

      {/* API Settings */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Stored locally in your browser. Never sent anywhere except Anthropic.
          </p>
        </Field>

        <Field label="Model">
          <select
            value={settings.model}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            className={INPUT_CLS}
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        <button
          onClick={handleSaveSettings}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            settingsSaved
              ? 'bg-green-700 text-white'
              : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
        >
          {settingsSaved ? <><Check size={14} /> Saved!</> : 'Save API Settings'}
        </button>
      </div>

      {/* Athlete Profile */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
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
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    active
                      ? 'bg-sky-900/50 border-sky-600/50 text-sky-300'
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
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
              <div key={key} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <span className="flex-1 text-sm text-white">{key.replace(/_/g, ' ')}</span>
                <input
                  type="number"
                  value={data.bestTimeS}
                  step="0.1"
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      events: {
                        ...profile.events,
                        [key]: { ...data, bestTimeS: +e.target.value },
                      },
                    })
                  }
                  className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-sky-500"
                />
                <span className="text-xs text-gray-500">s</span>
                <select
                  value={data.priority}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      events: {
                        ...profile.events,
                        [key]: { ...data, priority: e.target.value as 'A' | 'B' | 'C' },
                      },
                    })
                  }
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
                <button
                  onClick={() => removeEvent(key)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {/* Add new event */}
            <div className="flex items-center gap-2 bg-gray-800/50 border border-dashed border-gray-700 rounded-lg px-3 py-2">
              <input
                type="text"
                value={newEvent.key}
                onChange={(e) => setNewEvent({ ...newEvent, key: e.target.value })}
                placeholder="e.g. 200_back"
                className="flex-1 bg-transparent text-xs text-gray-300 placeholder-gray-600 focus:outline-none"
              />
              <input
                type="number"
                value={newEvent.bestTimeS || ''}
                step="0.1"
                onChange={(e) => setNewEvent({ ...newEvent, bestTimeS: +e.target.value })}
                placeholder="time"
                className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-xs text-gray-100 focus:outline-none focus:border-sky-500"
              />
              <span className="text-xs text-gray-500">s</span>
              <select
                value={newEvent.priority}
                onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as 'A' | 'B' | 'C' })}
                className="bg-gray-700 border border-gray-600 rounded px-1.5 py-0.5 text-xs text-gray-100 focus:outline-none"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
              <button
                onClick={addEvent}
                className="text-sky-500 hover:text-sky-400 transition-colors"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </Field>

        <button
          onClick={handleSaveProfile}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            profileSaved
              ? 'bg-green-700 text-white'
              : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
        >
          {profileSaved ? <><Check size={14} /> Saved!</> : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
