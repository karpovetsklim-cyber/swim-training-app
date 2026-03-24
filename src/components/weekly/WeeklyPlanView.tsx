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
} from 'lucide-react';
import { SetCard } from '../session/SetCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { exportWeeklyMarkdown, exportWeeklyPDF } from '../../lib/export';
import type { WeeklyPlan, Session, SwimSet } from '../../types';

const GHOST_BTN =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/50 text-slate-400 hover:border-slate-600/60 hover:text-slate-200 text-xs font-mono tracking-wide uppercase transition-all duration-200';

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

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      <button
        onClick={onClick}
        className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-all duration-200 ${
          isActive
            ? 'text-slate-100'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <GripVertical
          size={11}
          className="cursor-grab text-slate-700 hover:text-slate-500"
          {...attributes}
          {...listeners}
        />
        {session.day.slice(0, 3)}
        <span className={`font-mono text-[10px] ${isActive ? 'text-slate-500' : 'text-slate-700'}`}>
          {session.totalVolumeM}m
        </span>
        {isActive && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px bg-slate-400/60 rounded-full" />
        )}
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
    <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 backdrop-blur-sm">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <p className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.2em]">
            {session.day}
          </p>
          <h3 className="font-light text-slate-200 text-base tracking-wide">
            {session.focus}
          </h3>
          <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider hidden sm:inline">
            {session.energySystem}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-slate-400">{session.totalVolumeM}m</span>
          <ChevronDown
            size={14}
            className={`text-slate-600 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          />
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4">
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

export function WeeklyPlanView({ plan, onSave, onRefine, isRefining, saved }: WeeklyPlanViewProps) {
  const [currentPlan, setCurrentPlan] = useState<WeeklyPlan>(plan);
  const [activeDay, setActiveDay] = useState<string | null>(plan.sessions[0]?.day ?? null);
  const [refineText, setRefineText] = useState('');
  const [showRefine, setShowRefine] = useState(false);

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

  const totalVol = currentPlan.sessions.reduce((s, d) => s + d.totalVolumeM, 0);
  const activeSession = currentPlan.sessions.find((s) => s.day === activeDay);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 backdrop-blur-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1">
              {currentPlan.sessions.length} sessions
            </p>
            <h2 className="text-2xl font-extralight text-slate-100 tracking-wide">
              {currentPlan.phase} Training Week
            </h2>
            <p className="font-mono text-3xl font-light text-slate-300 mt-1">
              {totalVol.toLocaleString()}
              <span className="text-base text-slate-500 ml-1">m total</span>
            </p>
            {currentPlan.context && (
              <p className="text-xs text-slate-600 mt-2 italic">{currentPlan.context}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRefine(!showRefine)}
              disabled={!onRefine || isRefining}
              className={`${GHOST_BTN} disabled:opacity-30`}
            >
              <Sparkles size={12} /> Refine
            </button>
            <button onClick={() => exportWeeklyMarkdown(currentPlan)} className={GHOST_BTN}>
              <FileText size={12} /> .md
            </button>
            <button onClick={() => exportWeeklyPDF(currentPlan)} className={GHOST_BTN}>
              <FileDown size={12} /> PDF
            </button>
            {onSave && (
              <button
                onClick={() => onSave(currentPlan)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide uppercase transition-all duration-200 ${
                  saved
                    ? 'border border-emerald-800/50 text-emerald-400/70'
                    : 'bg-slate-100 hover:bg-white text-slate-900 font-medium'
                }`}
              >
                <Save size={12} /> {saved ? 'Saved' : 'Save Week'}
              </button>
            )}
          </div>
        </div>

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
                placeholder='e.g. "make Wednesday easier" or "add more IM on Thursday"'
                className="flex-1 bg-slate-900 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500/50"
              />
              <button
                onClick={() => void handleRefine()}
                disabled={!refineText.trim() || isRefining}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-white disabled:opacity-30 text-slate-900 rounded-lg text-xs font-medium transition-all"
              >
                {isRefining ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                Refine
              </button>
            </div>
          </div>
        )}
      </div>

      {isRefining ? (
        <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 p-6">
          <LoadingSpinner label="Refining weekly plan..." />
        </div>
      ) : (
        <>
          {/* Day tabs with drag-and-drop */}
          <div className="border border-slate-800/60 rounded-xl bg-slate-900/40 backdrop-blur-sm px-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={currentPlan.sessions.map((s) => s.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-0 overflow-x-auto">
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
          </div>

          {/* Active day detail */}
          {activeSession && (
            <DayPanel
              session={activeSession}
              onSetUpdate={(setIndex, updated) =>
                handleSetUpdate(activeSession.id, setIndex, updated)
              }
            />
          )}

          {/* All days overview */}
          <details className="group">
            <summary className="cursor-pointer font-mono text-[10px] text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors py-2 list-none flex items-center gap-2">
              <ChevronDown size={12} className="group-open:rotate-180 transition-transform" />
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
