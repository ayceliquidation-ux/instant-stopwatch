import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Coffee, Brain, Volume2, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { formatTimer, cn } from '../utils';
import { soundEngine, AmbientProfile } from '../utils/soundEngine';

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

const MODES: Record<PomodoroMode, { label: string; subtitle: string; seconds: number }> = {
  work: { label: 'DEEP FOCUS', subtitle: '25 Minute Cognitive Immersion', seconds: 1500 },
  shortBreak: { label: 'SHORT REST', subtitle: '5 Minute Decompression', seconds: 300 },
  longBreak: { label: 'GRAND INTERMISSION', subtitle: '15 Minute Restoration', seconds: 900 },
};

interface FocusTask {
  id: string;
  title: string;
  estPomodoros: number;
  completedPomodoros: number;
  done: boolean;
}

interface PomodoroProps {
  onTitleUpdate?: (title: string | null) => void;
}

export default function Pomodoro({ onTitleUpdate }: PomodoroProps) {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [secondsLeft, setSecondsLeft] = useState(MODES.work.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState<number>(() => {
    const saved = localStorage.getItem('pomodoro_sessions');
    return saved ? Number(saved) : 0;
  });

  // Procedural Ambient Audio State
  const [ambient, setAmbient] = useState<AmbientProfile>('none');
  const [ambientVol, setAmbientVol] = useState<number>(0.35);

  // Integrated Pomofocus-killer Task Queue
  const [tasks, setTasks] = useState<FocusTask[]>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_tasks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 't1', title: 'Deep architecture & implementation review', estPomodoros: 2, completedPomodoros: 0, done: false },
    ];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const endTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('pomodoro_sessions', String(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    return () => {
      soundEngine.stopAmbient();
    };
  }, []);

  // Zero-Drift Date.now() delta timer
  useEffect(() => {
    if (!isRunning) {
      endTimestampRef.current = null;
      return;
    }

    if (!endTimestampRef.current) {
      endTimestampRef.current = Date.now() + secondsLeft * 1000;
    }

    const interval = window.setInterval(() => {
      if (!endTimestampRef.current) return;
      const remMs = endTimestampRef.current - Date.now();
      if (remMs > 0) {
        setSecondsLeft(Math.ceil(remMs / 1000));
        return;
      }

      // Cycle Complete
      setIsRunning(false);
      endTimestampRef.current = null;
      soundEngine.playAlarm();

      if (mode === 'work') {
        const nextSessionCount = sessions + 1;
        setSessions(nextSessionCount);
        setTasks((prev) => {
          const activeIdx = prev.findIndex((t) => !t.done);
          if (activeIdx === -1) return prev;
          return prev.map((t, idx) =>
            idx === activeIdx ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
          );
        });
        const nextMode = nextSessionCount % 4 === 0 ? 'longBreak' : 'shortBreak';
        setMode(nextMode);
        setSecondsLeft(MODES[nextMode].seconds);
        soundEngine.notify('Focus Cycle Complete', `Time for ${MODES[nextMode].label}.`);
      } else {
        setMode('work');
        setSecondsLeft(MODES.work.seconds);
        soundEngine.notify('Break Complete', 'Ready for your next 25-minute Deep Focus session.');
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, mode, sessions, secondsLeft]);

  useEffect(() => {
    if (isRunning) {
      onTitleUpdate?.(`[${formatTimer(secondsLeft)}] ${MODES[mode].label} — Stopwatch+`);
    } else {
      onTitleUpdate?.(null);
    }
  }, [isRunning, secondsLeft, mode, onTitleUpdate]);

  const handleStartPause = useCallback(() => {
    soundEngine.playClick();
    setIsRunning((prev) => {
      const next = !prev;
      if (next) {
        endTimestampRef.current = Date.now() + secondsLeft * 1000;
      } else {
        endTimestampRef.current = null;
      }
      return next;
    });
  }, [secondsLeft]);

  const handleReset = useCallback(() => {
    soundEngine.playClick();
    setIsRunning(false);
    endTimestampRef.current = null;
    setSecondsLeft(MODES[mode].seconds);
    onTitleUpdate?.(null);
  }, [mode, onTitleUpdate]);

  const switchMode = (newMode: PomodoroMode) => {
    soundEngine.playClick();
    setIsRunning(false);
    endTimestampRef.current = null;
    setMode(newMode);
    setSecondsLeft(MODES[newMode].seconds);
  };

  const handleAmbientChange = (prof: AmbientProfile) => {
    setAmbient(prof);
    soundEngine.setAmbient(prof, ambientVol);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        title: newTaskTitle.trim(),
        estPomodoros: 1,
        completedPomodoros: 0,
        done: false,
      },
    ]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleStartPause();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleStartPause, handleReset]);

  const progress = ((MODES[mode].seconds - secondsLeft) / MODES[mode].seconds) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full">
      {/* Left/Center Focus Dial & Ambient Soundscape Studio */}
      <div className="lg:col-span-6 flex flex-col items-center lg:items-start space-y-8">
        <div className="relative flex items-center justify-center p-2">
          <div className="absolute inset-0 rounded-full bg-[#C8A45D]/[0.06] blur-[75px] pointer-events-none" />
          
          <div className="relative w-72 h-72 sm:w-88 sm:h-88 rounded-full glass neo-shadow flex flex-col items-center justify-center overflow-hidden">
            <div 
              className="absolute inset-0 bg-center bg-cover opacity-[0.12] mix-blend-screen pointer-events-none"
              style={{ backgroundImage: `url('/emblem.jpg')` }}
            />

            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(200, 164, 93, 0.14)" strokeWidth="0.4" />
              <circle cx="50" cy="50" r="45.5" fill="none" stroke="rgba(200, 164, 93, 0.22)" strokeWidth="0.6" strokeDasharray="0.5 4.26" />
              <motion.circle
                cx="50"
                cy="50"
                r="47.5"
                fill="none"
                stroke="#C8A45D"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeDasharray="298.45"
                initial={{ strokeDashoffset: 298.45 }}
                animate={{ strokeDashoffset: 298.45 - (298.45 * progress) / 100 }}
                transition={{ duration: 0.3, ease: "linear" }}
              />
            </svg>

            <div className="z-10 flex flex-col items-center">
              <div className="p-3 rounded-full bg-[#C8A45D]/10 border border-[#C8A45D]/30 text-[#E5C687] mb-3">
                {mode === 'work' ? <Brain size={22} /> : <Coffee size={22} />}
              </div>
              <span className="text-[9px] uppercase tracking-[0.35em] text-[#C8A45D] font-semibold mb-2">
                {MODES[mode].label}
              </span>
              <span className="text-5xl sm:text-6xl md:text-7xl font-mono font-light tracking-tight tabular-nums text-[#F4F1EA] gold-text-glow">
                {formatTimer(secondsLeft)}
              </span>

              {/* 4-Cycle Diamond Indicators */}
              <div className="mt-6 flex items-center space-x-3">
                {[...Array(4)].map((_, i) => {
                  const completed = i < (sessions % 4);
                  return (
                    <span
                      key={i}
                      className={cn(
                        "text-xs transition-all duration-300",
                        completed
                          ? "text-[#E5C687] drop-shadow-[0_0_6px_rgba(229,198,135,0.8)] scale-125"
                          : "text-[#8A7348]/40"
                      )}
                    >
                      ◆
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Chamfered Controls */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleStartPause}
            className="btn-chamfer px-9 py-4 flex items-center space-x-3 cursor-pointer min-w-[180px] justify-center"
          >
            <span className="text-[#C8A45D] text-sm">◇</span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F4F1EA]">
              {isRunning ? 'PAUSE CADENCE' : 'BEGIN SESSION'}
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="btn-chamfer px-6 py-4 flex items-center space-x-2.5 cursor-pointer text-[#E5C687]"
          >
            <RotateCcw size={15} className="text-[#C8A45D]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">RESET</span>
          </motion.button>
        </div>

        {/* Procedural Web Audio Focus Soundscape Mixer */}
        <div className="w-full glass rounded-2xl p-5 border border-[#C8A45D]/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 size={15} className="text-[#C8A45D]" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#E5C687]">
                PROCEDURAL FOCUS SOUNDSCAPE SYNTHESIZER
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={ambientVol}
              onChange={(e) => {
                const v = Number(e.target.value);
                setAmbientVol(v);
                soundEngine.setAmbient(ambient, v);
              }}
              className="w-24 accent-[#C8A45D] cursor-pointer"
              title="Ambient Volume"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'none' as const, label: 'SILENCE' },
              { id: 'brown' as const, label: 'BROWN NOISE' },
              { id: 'rain' as const, label: 'PINK RAIN' },
              { id: 'gamma' as const, label: '40Hz GAMMA' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleAmbientChange(item.id)}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer",
                  ambient === item.id
                    ? "bg-[#C8A45D] text-[#0A0908] border-[#E5C687] font-bold"
                    : "bg-[#12100E] text-[#9E9587] border-[#C8A45D]/20 hover:text-[#F4F1EA]"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Cadence Selector & Focus Task Queue */}
      <div className="lg:col-span-6 w-full space-y-6">
        <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#C8A45D]/15">
            <div className="flex items-center space-x-2">
              <span className="text-[#C8A45D] text-xs">◆</span>
              <h3 className="font-editorial text-xl text-[#F4F1EA] tracking-wide">
                Focus Cadence
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#E5C687]">
              {sessions} POMODOROS COMPLETED
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {(Object.keys(MODES) as PomodoroMode[]).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                    active
                      ? "bg-[#C8A45D]/20 border-[#C8A45D] text-[#F4F1EA]"
                      : "bg-[#12100E]/70 border-[#C8A45D]/15 text-[#9E9587] hover:text-[#F4F1EA]"
                  )}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E5C687]">
                    {MODES[m].label}
                  </div>
                  <div className="font-mono text-sm text-[#F4F1EA] mt-1">
                    {Math.floor(MODES[m].seconds / 60)}:00
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Executive Focus Ledger (Tasks) */}
        <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#C8A45D]/15">
            <div className="flex items-center space-x-2">
              <span className="text-[#C8A45D] text-xs">◆</span>
              <h3 className="font-editorial text-xl text-[#F4F1EA] tracking-wide">
                Executive Focus Ledger
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8A7348]">
              {tasks.filter((t) => t.done).length}/{tasks.length} COMPLETE
            </span>
          </div>

          <form onSubmit={addTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Inscribe focus objective..."
              className="flex-1 bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl px-4 py-2.5 text-xs text-[#F4F1EA] placeholder-[#8A7348]/60 focus:outline-none focus:border-[#C8A45D]"
            />
            <button
              type="submit"
              className="btn-chamfer px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#E5C687] flex items-center space-x-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>ADD</span>
            </button>
          </form>

          <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#12100E]/80 border border-[#C8A45D]/15"
              >
                <button
                  onClick={() => toggleTask(t.id)}
                  className="flex items-center space-x-3 text-left flex-1 min-w-0 cursor-pointer"
                >
                  {t.done ? (
                    <CheckSquare size={15} className="text-[#C8A45D] shrink-0" />
                  ) : (
                    <Square size={15} className="text-[#8A7348] shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-xs truncate",
                      t.done ? "line-through text-[#8A7348]" : "text-[#F4F1EA]"
                    )}
                  >
                    {t.title}
                  </span>
                </button>
                <div className="flex items-center space-x-3 ml-2 shrink-0">
                  <span className="text-[10px] font-mono text-[#E5C687]">
                    {t.completedPomodoros}/{t.estPomodoros} ◆
                  </span>
                  <button
                    onClick={() => removeTask(t.id)}
                    className="text-[#8A7348] hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
