import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Save,
  FileText,
  FileDown,
  Sparkles,
  RefreshCw,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SetCard } from '../session/SetCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { exportWeeklyMarkdown, exportWeeklyPDF } from '../../lib/export';
import type { WeeklyPlan, Session, SwimSet } from '../../types';

// ── Sortable day tab ──────────────────────────────────────────────────────────

interface DayTabProps {
  session: Session;
  isActive: boolean;
  onClick: () => void;
}

function DayTab({ session, isActive, onClick }: DayTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: session.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
          isActive
            ? 'bg-sky-600 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        }`}
      >
        <GripVertical
          size={13}
          className="cursor-grab text-gray-400"
          {...attributes}
          {...listeners}
        />
        <span className="font-medium">{session.day}</span>
        <span className={`text-xs ${isActive ? 'text-sky-200' : 'text-gray-500'}`}>
          {session.totalVolumeM}m
        </span>
      </button>
    </div>
  );
}

// ── Day detail panel ──────────────────────────────────────────────────────────

interface DayPanelProps {
  session: Session;
  onSetUpdate: (setIndex: number, updated: SwimSet) => void;
}

function DayPanel({ session, onSetUpdate }: DayPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white">
            {session.day}: {session.focus}
          </h3>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {session.energySystem}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sky-400 font-semibold">{session.totalVolumeM}m</span>
          {collapsed ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
        </div>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 space-y-2">
          {session.sets.map((set, i) => (
            <SetCard
              key={`${session.id}-${i}`}
              set={set}
              index={i}
              onUpdate={(updated) => onSetUpdate(i, updated)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface WeeklyPlanViewProps {
  plan: WeeklyPlan;
  onSave?: (plan: WeeklyPlan) => void;
  onRefine?: (instruction: string) => Promise<void>;
  isRefining?: boolean;
  saved?: boolean;
}

export function WeeklyPlanView({
  plan,
  onSave,
  onRefine,
  isRefining,
  saved,
}: WeeklyPlanViewProps) {
  const [currentPlan, setCurrentPlan] = useState<WeeklyPlan>(plan);
  const [activeDay, setActiveDay] = useState<string | null>(plan.sessions[0]?.day ?? null);
  const [refineText, setRefineText] = useState('');
  const [showRefine, setShowRefine] = useState(false);

  // Sync on new plan from parent
  if (plan !== currentPlan && !isRefining) {
    setCurrentPlan(plan);
    setActiveDay(plan.sessions[0]?.day ?? null);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = currentPlan.sessions.findIndex((s) => s.id === active.id);
    const newIndex = currentPlan.sessions.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const sessions = [...currentPlan.sessions];
    const [moved] = sessions.splice(oldIndex, 1);
    if (moved) sessions.splice(newIndex, 0, moved);
    setCurrentPlan({ ...currentPlan, sessions });
  }

  function handleSetUpdate(sessionId: string, setIndex: number, updated: SwimSet) {
    const sessions = currentPlan.sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const sets = [...s.sets];
      sets[setIndex] = updated;
      const totalVolumeM = sets.reduce((sum, st) => sum + st.volumeM, 0);
      return { ...s, sets, totalVolumeM };
    });
    setCurrentPlan({ ...currentPlan, sessions });
  }

  async function handleRefine() {
    if (!refineText.trim() || !onRefine) return;
    await onRefine(refineText.trim());
    setRefineText('');
    setShowRefine(false);
  }

  const activeSession = currentPlan.sessions.find((s) => s.day === activeDay);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white">{currentPlan.phase} Training Week</h2>
            <p className="text-gray-400 text-sm mt-1">
              {currentPlan.sessions.length} sessions · Total:{' '}
              {currentPlan.sessions.reduce((s, d) => s + d.totalVolumeM, 0).toLocaleString()}m
            </p>
            {currentPlan.context && (
              <p className="text-xs text-gray-500 mt-1">{currentPlan.context}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRefine(!showRefine)}
              disabled={!onRefine || isRefining}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-800/40 hover:bg-violet-700/50 text-violet-300 text-sm border border-violet-700/40 transition-colors disabled:opacity-40"
            >
              <Sparkles size={14} /> AI Refine
            </button>
            <button
              onClick={() => exportWeeklyMarkdown(currentPlan)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm border border-gray-700 transition-colors"
            >
              <FileText size={14} /> .md
            </button>
            <button
              onClick={() => exportWeeklyPDF(currentPlan)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm border border-gray-700 transition-colors"
            >
              <FileDown size={14} /> PDF
            </button>
            {onSave && (
              <button
                onClick={() => onSave(currentPlan)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  saved
                    ? 'bg-green-900/40 text-green-300 border-green-700/40'
                    : 'bg-sky-700/40 hover:bg-sky-600/50 text-sky-300 border-sky-600/40'
                }`}
              >
                <Save size={14} /> {saved ? 'Saved!' : 'Save Week'}
              </button>
            )}
          </div>
        </div>

        {showRefine && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-400 mb-2">
              Describe what to change across the week. The AI will regenerate the full plan.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleRefine()}
                placeholder='e.g. "make Wednesday easier" or "add more IM on Thursday"'
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={() => void handleRefine()}
                disabled={!refineText.trim() || isRefining}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
              >
                {isRefining ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Refine
              </button>
            </div>
          </div>
        )}
      </div>

      {isRefining ? (
        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-6">
          <LoadingSpinner label="AI is refining your weekly plan..." />
        </div>
      ) : (
        <>
          {/* Day tabs with drag-and-drop */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={currentPlan.sessions.map((s) => s.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-2 overflow-x-auto pb-1">
                {currentPlan.sessions.map((session) => (
                  <DayTab
                    key={session.id}
                    session={session}
                    isActive={activeDay === session.day}
                    onClick={() => setActiveDay(session.day)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Active day detail */}
          {activeSession && (
            <DayPanel
              session={activeSession}
              onSetUpdate={(setIndex, updated) =>
                handleSetUpdate(activeSession.id, setIndex, updated)
              }
            />
          )}

          {/* All days overview (collapsed by default) */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-200 transition-colors py-2 list-none flex items-center gap-2">
              <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
              Show all days
            </summary>
            <div className="mt-3 space-y-3">
              {currentPlan.sessions.map((session) => (
                <DayPanel
                  key={session.id}
                  session={session}
                  onSetUpdate={(setIndex, updated) =>
                    handleSetUpdate(session.id, setIndex, updated)
                  }
                />
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
