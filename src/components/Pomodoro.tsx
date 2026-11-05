import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  Coffee,
  Brain,
  Volume2,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Sliders,
  ArrowUp,
  ArrowDown,
  Flame,
} from 'lucide-react';
import { formatTimer, cn } from '../utils';
import { soundEngine, AmbientProfile } from '../utils/soundEngine';

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

interface FocusTask {
  id: string;
  title: string;
  estPomodoros: number;
  completedPomodoros: number;
  done: boolean;
}

interface DailyTelemetry {
  date: string;
  focusedMinutes: number;
  completedSessions: number;
  streakDays: number;
}

interface PomodoroProps {
  onTitleUpdate?: (title: string | null) => void;
}

export default function Pomodoro({ onTitleUpdate }: PomodoroProps) {
  // Customizable Durations (in minutes)
  const [focusMins, setFocusMins] = useState<number>(() => {
    return Number(localStorage.getItem('pomo_focus_mins')) || 25;
  });
  const [shortBreakMins, setShortBreakMins] = useState<number>(() => {
    return Number(localStorage.getItem('pomo_short_mins')) || 5;
  });
  const [longBreakMins, setLongBreakMins] = useState<number>(() => {
    return Number(localStorage.getItem('pomo_long_mins')) || 15;
  });
  const [autoStartNext, setAutoStartNext] = useState<boolean>(() => {
    return localStorage.getItem('pomo_autostart') === 'true';
  });
  const [showSettings, setShowSettings] = useState(false);

  const [mode, setMode] = useState<PomodoroMode>('work');
  const [secondsLeft, setSecondsLeft] = useState(focusMins * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState<number>(() => {
    const saved = localStorage.getItem('pomodoro_sessions');
    return saved ? Number(saved) : 0;
  });

  // Daily Focus Telemetry
  const [telemetry, setTelemetry] = useState<DailyTelemetry>(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const saved = localStorage.getItem('pomodoro_daily_telemetry');
      if (saved) {
        const parsed: DailyTelemetry = JSON.parse(saved);
        if (parsed.date === today) return parsed;
        return {
          date: today,
          focusedMinutes: 0,
          completedSessions: 0,
          streakDays: parsed.completedSessions > 0 ? parsed.streakDays + 1 : parsed.streakDays || 1,
        };
      }
    } catch {}
    return { date: today, focusedMinutes: 0, completedSessions: 0, streakDays: 1 };
  });

  // Procedural Ambient Audio State
  const [ambient, setAmbient] = useState<AmbientProfile>('none');
  const [ambientVol, setAmbientVol] = useState<number>(0.35);

  // Interactive Task Manager
  const [tasks, setTasks] = useState<FocusTask[]>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_tasks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 't1', title: 'Deep architecture & implementation review', estPomodoros: 3, completedPomodoros: 0, done: false },
      { id: 't2', title: 'Synthesize telemetry benchmarks & QA', estPomodoros: 2, completedPomodoros: 0, done: false },
    ];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEst, setNewTaskEst] = useState(1);

  const endTimestampRef = useRef<number | null>(null);

  const modeConfig: Record<PomodoroMode, { label: string; subtitle: string; seconds: number }> = {
    work: {
      label: 'DEEP FOCUS',
      subtitle: `${focusMins} Minute Cognitive Immersion`,
      seconds: focusMins * 60,
    },
    shortBreak: {
      label: 'SHORT REST',
      subtitle: `${shortBreakMins} Minute Decompression`,
      seconds: shortBreakMins * 60,
    },
    longBreak: {
      label: 'GRAND INTERMISSION',
      subtitle: `${longBreakMins} Minute Restoration`,
      seconds: longBreakMins * 60,
    },
  };

  useEffect(() => {
    localStorage.setItem('pomo_focus_mins', String(focusMins));
    localStorage.setItem('pomo_short_mins', String(shortBreakMins));
    localStorage.setItem('pomo_long_mins', String(longBreakMins));
    localStorage.setItem('pomo_autostart', String(autoStartNext));
  }, [focusMins, shortBreakMins, longBreakMins, autoStartNext]);

  useEffect(() => {
    localStorage.setItem('pomodoro_sessions', String(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('pomodoro_daily_telemetry', JSON.stringify(telemetry));
  }, [telemetry]);

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
      soundEngine.playAlarm();

      if (mode === 'work') {
        const nextSessionCount = sessions + 1;
        setSessions(nextSessionCount);
        setTelemetry((prev) => ({
          ...prev,
          focusedMinutes: prev.focusedMinutes + focusMins,
          completedSessions: prev.completedSessions + 1,
        }));

        // Increment completedPomodoros on first active task
        setTasks((prev) => {
          const activeIdx = prev.findIndex((t) => !t.done);
          if (activeIdx === -1) return prev;
          return prev.map((t, idx) =>
            idx === activeIdx ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
          );
        });

        const nextMode = nextSessionCount % 4 === 0 ? 'longBreak' : 'shortBreak';
        const nextSecs = nextMode === 'longBreak' ? longBreakMins * 60 : shortBreakMins * 60;
        setMode(nextMode);
        setSecondsLeft(nextSecs);
        soundEngine.notify('Focus Cycle Complete', `Time for ${modeConfig[nextMode].label}.`);

        if (autoStartNext) {
          endTimestampRef.current = Date.now() + nextSecs * 1000;
          setIsRunning(true);
        } else {
          endTimestampRef.current = null;
          setIsRunning(false);
        }
      } else {
        const nextSecs = focusMins * 60;
        setMode('work');
        setSecondsLeft(nextSecs);
        soundEngine.notify('Break Complete', `Ready for your next ${focusMins}-minute Deep Focus session.`);

        if (autoStartNext) {
          endTimestampRef.current = Date.now() + nextSecs * 1000;
          setIsRunning(true);
        } else {
          endTimestampRef.current = null;
          setIsRunning(false);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, mode, sessions, secondsLeft, focusMins, shortBreakMins, longBreakMins, autoStartNext]);

  useEffect(() => {
    if (isRunning) {
      onTitleUpdate?.(`[${formatTimer(secondsLeft)}] ${modeConfig[mode].label} — Stopwatch+`);
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
    setSecondsLeft(modeConfig[mode].seconds);
    onTitleUpdate?.(null);
  }, [mode, focusMins, shortBreakMins, longBreakMins, onTitleUpdate]);

  const switchMode = (newMode: PomodoroMode) => {
    soundEngine.playClick();
    setIsRunning(false);
    endTimestampRef.current = null;
    setMode(newMode);
    const secs =
      newMode === 'work'
        ? focusMins * 60
        : newMode === 'shortBreak'
        ? shortBreakMins * 60
        : longBreakMins * 60;
    setSecondsLeft(secs);
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
        estPomodoros: Math.max(1, Math.min(12, newTaskEst)),
        completedPomodoros: 0,
        done: false,
      },
    ]);
    setNewTaskTitle('');
    setNewTaskEst(1);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const moveTask = (idx: number, dir: -1 | 1) => {
    setTasks((prev) => {
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, item);
      return copy;
    });
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

  const totalSecForMode = modeConfig[mode].seconds;
  const progress = totalSecForMode > 0 ? ((totalSecForMode - secondsLeft) / totalSecForMode) * 100 : 0;

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
                {modeConfig[mode].label}
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
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
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
            className="btn-chamfer px-5 py-4 flex items-center space-x-2 cursor-pointer text-[#E5C687]"
          >
            <RotateCcw size={15} className="text-[#C8A45D]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">RESET</span>
          </motion.button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-4 rounded-xl border transition-all cursor-pointer",
              showSettings
                ? "bg-[#C8A45D] text-[#0A0908] border-[#E5C687]"
                : "glass border-[#C8A45D]/20 text-[#E5C687]"
            )}
            title="Customize Focus & Break Durations"
          >
            <Sliders size={16} />
          </button>
        </div>

        {/* Customizable Durations & Auto-Start Drawer */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full glass rounded-2xl p-5 border border-[#C8A45D]/30 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-2.5">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#E5C687]">
                  CADENCE CALIBRATION (MINUTES)
                </span>
                <button
                  onClick={() => setAutoStartNext(!autoStartNext)}
                  className="text-[10px] font-mono uppercase text-[#C8A45D] cursor-pointer"
                >
                  AUTO-START NEXT PHASE: {autoStartNext ? '◆ ON' : '◇ OFF'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#8A7348] block mb-1">
                    Focus (15–90m)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={90}
                    value={focusMins}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(90, Number(e.target.value)));
                      setFocusMins(v);
                      if (mode === 'work' && !isRunning) setSecondsLeft(v * 60);
                    }}
                    className="w-full bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl p-2.5 text-xs font-mono text-[#F4F1EA]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#8A7348] block mb-1">
                    Short (3–15m)
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={15}
                    value={shortBreakMins}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(15, Number(e.target.value)));
                      setShortBreakMins(v);
                      if (mode === 'shortBreak' && !isRunning) setSecondsLeft(v * 60);
                    }}
                    className="w-full bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl p-2.5 text-xs font-mono text-[#F4F1EA]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#8A7348] block mb-1">
                    Long (15–45m)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={45}
                    value={longBreakMins}
                    onChange={(e) => {
                      const v = Math.max(5, Math.min(45, Number(e.target.value)));
                      setLongBreakMins(v);
                      if (mode === 'longBreak' && !isRunning) setSecondsLeft(v * 60);
                    }}
                    className="w-full bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl p-2.5 text-xs font-mono text-[#F4F1EA]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Procedural Web Audio Focus Soundscape Mixer */}
        <div className="w-full glass rounded-2xl p-5 border border-[#C8A45D]/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 size={15} className="text-[#C8A45D]" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#E5C687]">
                PROCEDURAL FOCUS SOUNDSCAPE SYNTHESIZER
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-[#8A7348]">
                {Math.round(ambientVol * 100)}%
              </span>
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

      {/* Right Column: Daily Focus Telemetry, Cadence Selector & Interactive Task Manager */}
      <div className="lg:col-span-6 w-full space-y-6">
        {/* Daily Focus Telemetry Strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-4 border border-[#C8A45D]/20">
            <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-[#8A7348] block">
              FOCUSED TODAY
            </span>
            <span className="text-xl font-mono text-[#E5C687] mt-1 block">
              {telemetry.focusedMinutes}m
            </span>
          </div>
          <div className="glass rounded-xl p-4 border border-[#C8A45D]/20">
            <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-[#8A7348] block">
              SESSIONS TODAY
            </span>
            <span className="text-xl font-mono text-[#F4F1EA] mt-1 block">
              {telemetry.completedSessions} ◆
            </span>
          </div>
          <div className="glass rounded-xl p-4 border border-[#C8A45D]/20">
            <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-[#8A7348] block">
              DAILY STREAK
            </span>
            <span className="text-xl font-mono text-amber-300 mt-1 flex items-center space-x-1">
              <Flame size={16} className="text-[#C8A45D]" />
              <span>{telemetry.streakDays}d</span>
            </span>
          </div>
        </div>

        {/* Cadence Selector */}
        <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#C8A45D]/15">
            <div className="flex items-center space-x-2">
              <span className="text-[#C8A45D] text-xs">◆</span>
              <h3 className="font-editorial text-xl text-[#F4F1EA] tracking-wide">
                Focus Cadence
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#E5C687]">
              {sessions} TOTAL POMODOROS
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {(Object.keys(modeConfig) as PomodoroMode[]).map((m) => {
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
                    {modeConfig[m].label}
                  </div>
                  <div className="font-mono text-sm text-[#F4F1EA] mt-1">
                    {Math.floor(modeConfig[m].seconds / 60)}:00
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Executive Task Manager */}
        <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#C8A45D]/15">
            <div className="flex items-center space-x-2">
              <span className="text-[#C8A45D] text-xs">◆</span>
              <h3 className="font-editorial text-xl text-[#F4F1EA] tracking-wide">
                Executive Focus Task Queue
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8A7348]">
              {tasks.filter((t) => t.done).length}/{tasks.length} COMPLETE
            </span>
          </div>

          <form onSubmit={addTask} className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Inscribe focus objective..."
              className="flex-1 bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl px-4 py-2.5 text-xs text-[#F4F1EA] placeholder-[#8A7348]/60 focus:outline-none focus:border-[#C8A45D]"
            />
            <div className="flex items-center space-x-1.5 bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl px-3 py-2">
              <span className="text-[10px] font-mono text-[#8A7348]">EST ◆</span>
              <input
                type="number"
                min={1}
                max={12}
                value={newTaskEst}
                onChange={(e) => setNewTaskEst(Number(e.target.value))}
                className="w-10 bg-transparent text-xs font-mono text-[#E5C687] text-center focus:outline-none"
                title="Estimated Pomodoros"
              />
            </div>
            <button
              type="submit"
              className="btn-chamfer px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#E5C687] flex items-center space-x-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>ADD</span>
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {tasks.map((t, idx) => (
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
                <div className="flex items-center space-x-2 ml-2 shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C8A45D]/10 text-[#E5C687]">
                    {t.completedPomodoros}/{t.estPomodoros} ◆
                  </span>
                  <button
                    onClick={() => moveTask(idx, -1)}
                    disabled={idx === 0}
                    className="text-[#8A7348] hover:text-[#E5C687] disabled:opacity-25 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => moveTask(idx, 1)}
                    disabled={idx === tasks.length - 1}
                    className="text-[#8A7348] hover:text-[#E5C687] disabled:opacity-25 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => removeTask(t.id)}
                    className="text-[#8A7348] hover:text-red-400 cursor-pointer"
                    title="Delete Task"
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
