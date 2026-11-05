import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flag, RotateCcw, Download, Copy, Check, Flame, Swords, Clock, Edit3 } from 'lucide-react';
import { formatTime, formatTimer, cn } from '../utils';
import { Lap } from '../types';
import { soundEngine } from '../utils/soundEngine';

type ChronoMode = 'telemetry' | 'hiit' | 'chess';

interface StopwatchProps {
  onTitleUpdate?: (title: string | null) => void;
}

export default function Stopwatch({ onTitleUpdate }: StopwatchProps) {
  const [subMode, setSubMode] = useState<ChronoMode>('telemetry');

  return (
    <div className="space-y-8 w-full">
      {/* Sub-Mode Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex p-1.5 rounded-2xl glass border border-[#C8A45D]/25">
          {[
            { id: 'telemetry' as const, label: 'PRO TELEMETRY CHRONOGRAPH', icon: Clock },
            { id: 'hiit' as const, label: 'HIIT / TABATA ENGINE', icon: Flame },
            { id: 'chess' as const, label: 'DUAL CHESS / DEBATE CLOCK', icon: Swords },
          ].map((item) => {
            const active = subMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTitleUpdate?.(null);
                  setSubMode(item.id);
                }}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center space-x-2 transition-all cursor-pointer",
                  active
                    ? "bg-[#C8A45D] text-[#0A0908] shadow-md"
                    : "text-[#9E9587] hover:text-[#F4F1EA]"
                )}
              >
                <item.icon size={13} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subMode === 'telemetry' && <TelemetryChronograph key="telemetry" onTitleUpdate={onTitleUpdate} />}
        {subMode === 'hiit' && <HIITIntervalEngine key="hiit" onTitleUpdate={onTitleUpdate} />}
        {subMode === 'chess' && <ChessClockEngine key="chess" onTitleUpdate={onTitleUpdate} />}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================================
 * 1. PRO TELEMETRY CHRONOGRAPH
 * ============================================================================ */
function TelemetryChronograph({ onTitleUpdate }: StopwatchProps) {
  const [time, setTime] = useState<number>(() => {
    const saved = localStorage.getItem('stopwatch_time');
    return saved ? Number(saved) : 0;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>(() => {
    try {
      const saved = localStorage.getItem('stopwatch_laps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [editingLapId, setEditingLapId] = useState<string | null>(null);
  const [copiedTable, setCopiedTable] = useState(false);

  const rafRef = useRef<number | null>(null);
  const startPerfRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(time);

  useEffect(() => {
    localStorage.setItem('stopwatch_time', String(Math.floor(time)));
  }, [time]);

  useEffect(() => {
    localStorage.setItem('stopwatch_laps', JSON.stringify(laps));
  }, [laps]);

  useEffect(() => {
    if (isRunning) {
      startPerfRef.current = performance.now();
      const baseAcc = accumulatedRef.current;

      const tick = () => {
        const now = performance.now();
        const nextTime = baseAcc + (now - startPerfRef.current);
        setTime(nextTime);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      accumulatedRef.current = time;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning]);

  // Dynamic Browser Title
  useEffect(() => {
    if (isRunning) {
      onTitleUpdate?.(`[${formatTime(time)}] Lap ${laps.length + 1} — Stopwatch+`);
    } else if (time > 0) {
      onTitleUpdate?.(`[PAUSED ${formatTime(time)}] — Stopwatch+`);
    } else {
      onTitleUpdate?.(null);
    }
  }, [isRunning, Math.floor(time / 500), laps.length, onTitleUpdate]);

  const handleStartPause = useCallback(() => {
    soundEngine.playClick();
    setIsRunning((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    soundEngine.playClick();
    setIsRunning(false);
    accumulatedRef.current = 0;
    setTime(0);
    setLaps([]);
    localStorage.removeItem('stopwatch_time');
    localStorage.removeItem('stopwatch_laps');
    onTitleUpdate?.(null);
  }, [onTitleUpdate]);

  const handleLap = useCallback(() => {
    if (!isRunning && time === 0) return;
    soundEngine.playClick();
    setLaps((prevLaps) => {
      const lastLapTime = prevLaps.length > 0 ? prevLaps[0].overallTime : 0;
      const newLap: Lap = {
        id: Math.random().toString(36).substring(2, 9),
        time: time - lastLapTime,
        overallTime: time,
        label: `Split ${(prevLaps.length + 1).toString().padStart(2, '0')}`,
      };
      return [newLap, ...prevLaps];
    });
  }, [isRunning, time]);

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
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleLap();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleStartPause, handleLap, handleReset]);

  const updateLapLabel = (id: string, label: string) => {
    setLaps((prev) => prev.map((l) => (l.id === id ? { ...l, label } : l)));
  };

  const currentLapTime = laps.length > 0 ? time - laps[0].overallTime : time;

  // Telemetry Calculations
  const lapTimes = laps.map((l) => l.time);
  const fastestLap = lapTimes.length > 1 ? Math.min(...lapTimes) : null;
  const slowestLap = lapTimes.length > 1 ? Math.max(...lapTimes) : null;
  const avgLap =
    lapTimes.length > 0 ? lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length : 0;
  const stdDev =
    lapTimes.length > 1
      ? Math.sqrt(
          lapTimes.reduce((acc, val) => acc + Math.pow(val - avgLap, 2), 0) / lapTimes.length
        )
      : 0;

  const formatDelta = (lapMs: number) => {
    if (lapTimes.length < 2) return '—';
    const diff = (lapMs - avgLap) / 1000;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(2)}s`;
  };

  const exportCSV = () => {
    if (laps.length === 0) return;
    const headers = ['Lap Number,Label,Split Time,Delta vs Avg,Cumulative Time'];
    const rows = [...laps].reverse().map((lap, idx) => {
      const num = idx + 1;
      const lbl = (lap.label || `Split ${num}`).replace(/,/g, ' ');
      return `${num},"${lbl}",${formatTime(lap.time)},${formatDelta(lap.time)},${formatTime(lap.overallTime)}`;
    });
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stopwatch-telemetry-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyFormattedTable = () => {
    if (laps.length === 0) return;
    const header = `#\tLabel\tSplit\tDelta\tTotal`;
    const lines = [...laps].reverse().map((lap, idx) => {
      return `${idx + 1}\t${lap.label || `Split ${idx + 1}`}\t${formatTime(lap.time)}\t${formatDelta(lap.time)}\t${formatTime(lap.overallTime)}`;
    });
    const summary = `\nAvg Split: ${formatTime(avgLap)} | Consistency (σ): ±${(stdDev / 1000).toFixed(2)}s`;
    navigator.clipboard.writeText([header, ...lines, summary].join('\n'));
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full"
    >
      {/* Left Column: Dial & Primary Controls */}
      <div className="lg:col-span-6 flex flex-col items-center lg:items-start space-y-8">
        <div className="relative flex items-center justify-center p-2">
          <div className="absolute inset-0 rounded-full bg-[#C8A45D]/[0.06] blur-[70px] pointer-events-none" />

          <div className="relative w-72 h-72 sm:w-84 sm:h-84 md:w-92 md:h-92 rounded-full glass neo-shadow flex flex-col items-center justify-center overflow-hidden">
            <div 
              className="absolute inset-0 bg-center bg-cover opacity-[0.12] mix-blend-screen pointer-events-none animate-spin-slow"
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
                strokeWidth="0.95"
                strokeLinecap="round"
                strokeDasharray="298.45"
                animate={{
                  strokeDashoffset: 298.45 - (298.45 * (currentLapTime % 60000)) / 60000,
                }}
                transition={{ duration: 0.05, ease: "linear" }}
              />
            </svg>

            <div className="relative z-10 flex flex-col items-center px-6 text-center">
              <span className="text-[9px] uppercase tracking-[0.4em] text-[#8A7348] font-semibold mb-3">
                ZERO-DRIFT QUARTZ TELEMETRY
              </span>
              <span className="text-5xl sm:text-6xl md:text-7xl font-mono font-light tracking-tight tabular-nums text-[#F4F1EA] gold-text-glow">
                {formatTime(time)}
              </span>

              <div className="mt-5 pt-3.5 border-t border-[#C8A45D]/15 flex items-center space-x-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#9E9587]">
                  CURRENT SPLIT
                </span>
                <span className="text-xs font-mono font-medium text-[#E5C687] tabular-nums">
                  {formatTime(currentLapTime)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chamfered Gold Action Buttons */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleStartPause}
            className={cn(
              "btn-chamfer px-9 py-4 flex items-center space-x-3 cursor-pointer min-w-[175px] justify-center",
              isRunning && "border-[#E5C687]"
            )}
          >
            <span className="text-[#C8A45D] text-sm">◇</span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F4F1EA]">
              {isRunning ? 'PAUSE' : time > 0 ? 'RESUME' : 'START'}
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLap}
            disabled={!isRunning && time === 0}
            className="btn-chamfer px-7 py-4 flex items-center space-x-3 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <span className="text-[#C8A45D] text-sm">◇</span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E5C687]">
              LAP SPLIT
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            title="Reset Chronograph (R)"
            className="p-4 rounded-xl glass text-[#9E9587] hover:text-[#F4F1EA] hover:border-[#C8A45D]/40 transition-all cursor-pointer"
          >
            <RotateCcw size={18} />
          </motion.button>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-[10px] uppercase tracking-[0.22em] text-[#8A7348]">
          <span>
            <kbd className="px-2 py-0.5 rounded bg-[#12100E] border border-[#C8A45D]/25 text-[#E5C687] font-mono mr-1.5">SPACE</kbd>
            Start / Pause
          </span>
          <span>
            <kbd className="px-2 py-0.5 rounded bg-[#12100E] border border-[#C8A45D]/25 text-[#E5C687] font-mono mr-1.5">L</kbd>
            Lap
          </span>
          <span>
            <kbd className="px-2 py-0.5 rounded bg-[#12100E] border border-[#C8A45D]/25 text-[#E5C687] font-mono mr-1.5">R</kbd>
            Reset
          </span>
          <span>
            <kbd className="px-2 py-0.5 rounded bg-[#12100E] border border-[#C8A45D]/25 text-[#E5C687] font-mono mr-1.5">F</kbd>
            Cinema Mode
          </span>
        </div>
      </div>

      {/* Right Column: Telemetry Dashboard & Split Registry */}
      <div className="lg:col-span-6 w-full space-y-5">
        {/* Telemetry Metrics Strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-4 border border-[#C8A45D]/20">
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#8A7348] block">
              AVG SPLIT PACE
            </span>
            <span className="text-lg font-mono text-[#E5C687] mt-1 block tabular-nums">
              {laps.length > 0 ? formatTime(avgLap) : '00:00.00'}
            </span>
          </div>
          <div className="glass rounded-xl p-4 border border-[#C8A45D]/20">
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#8A7348] block">
              FASTEST LAP
            </span>
            <span className="text-lg font-mono text-emerald-400 mt-1 block tabular-nums">
              {fastestLap !== null ? formatTime(fastestLap) : laps.length === 1 ? formatTime(laps[0].time) : '00:00.00'}
            </span>
          </div>
          <div className="glass rounded-xl p-4 border border-[#C8A45D]/20">
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#8A7348] block">
              CONSISTENCY (σ)
            </span>
            <span className="text-lg font-mono text-[#F4F1EA] mt-1 block tabular-nums">
              ±{(stdDev / 1000).toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Split Registry Card */}
        <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#C8A45D]/15">
            <div className="flex items-center space-x-2">
              <span className="text-[#C8A45D] text-xs">◆</span>
              <h3 className="font-editorial text-xl text-[#F4F1EA] tracking-wide">
                Telemetry Split Registry
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={copyFormattedTable}
                disabled={laps.length === 0}
                className="px-3 py-1.5 rounded-lg bg-[#12100E] border border-[#C8A45D]/30 text-[10px] font-mono uppercase tracking-wider text-[#E5C687] hover:bg-[#C8A45D]/20 disabled:opacity-35 flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                {copiedTable ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedTable ? 'COPIED' : 'COPY TABLE'}</span>
              </button>
              <button
                onClick={exportCSV}
                disabled={laps.length === 0}
                className="px-3 py-1.5 rounded-lg bg-[#C8A45D]/15 border border-[#C8A45D]/40 text-[10px] font-mono uppercase tracking-wider text-[#E5C687] hover:bg-[#C8A45D] hover:text-[#0A0908] disabled:opacity-35 flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <Download size={12} />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 px-3 text-[9px] font-semibold text-[#8A7348] uppercase tracking-[0.22em] pb-2.5 border-b border-[#C8A45D]/10">
            <span className="col-span-4">Lap / Label</span>
            <span className="col-span-3">Split</span>
            <span className="col-span-2 text-center">Pace Δ</span>
            <span className="col-span-3 text-right">Total</span>
          </div>

          <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-[#C8A45D]/10 mt-1 pr-1">
            <AnimatePresence initial={false}>
              {laps.map((lap, index) => {
                const lapNum = laps.length - index;
                const isFastest = fastestLap !== null && lap.time === fastestLap;
                const isSlowest = slowestLap !== null && lap.time === slowestLap;
                const delta = formatDelta(lap.time);
                const isNegativeDelta = delta.startsWith('-');

                return (
                  <motion.div
                    key={lap.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="grid grid-cols-12 items-center py-3 px-3 hover:bg-[#C8A45D]/[0.05] transition-colors text-xs"
                  >
                    {/* Inline Editable Label */}
                    <div className="col-span-4 flex items-center space-x-2 pr-2">
                      <span className="font-mono text-[#8A7348] text-[11px]">
                        #{lapNum.toString().padStart(2, '0')}
                      </span>
                      {editingLapId === lap.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={lap.label || ''}
                          onChange={(e) => updateLapLabel(lap.id, e.target.value)}
                          onBlur={() => setEditingLapId(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingLapId(null)}
                          className="w-full bg-[#0A0908] border border-[#C8A45D] rounded px-1.5 py-0.5 text-xs text-[#F4F1EA] focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingLapId(lap.id)}
                          title="Click to rename split"
                          className="group flex items-center space-x-1 text-left truncate text-[#F4F1EA] hover:text-[#E5C687] cursor-pointer"
                        >
                          <span className="truncate">{lap.label || `Split ${lapNum}`}</span>
                          <Edit3 size={10} className="opacity-0 group-hover:opacity-70 shrink-0 text-[#C8A45D]" />
                        </button>
                      )}
                    </div>

                    {/* Split + Badges */}
                    <div className="col-span-3 flex items-center space-x-1.5 font-mono tabular-nums">
                      <span className="text-[#F4F1EA] font-medium">{formatTime(lap.time)}</span>
                      {isFastest && (
                        <span className="text-[8px] font-sans font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          FASTEST
                        </span>
                      )}
                      {isSlowest && (
                        <span className="text-[8px] font-sans font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                          SLOWEST
                        </span>
                      )}
                    </div>

                    {/* Pace Delta */}
                    <span
                      className={cn(
                        "col-span-2 text-center font-mono text-[11px] tabular-nums",
                        delta === '—'
                          ? "text-[#8A7348]"
                          : isNegativeDelta
                          ? "text-emerald-400"
                          : "text-amber-300"
                      )}
                    >
                      {delta}
                    </span>

                    {/* Cumulative */}
                    <span className="col-span-3 font-mono text-[#9E9587] text-right tabular-nums">
                      {formatTime(lap.overallTime)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {laps.length === 0 && (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                <Flag size={20} className="text-[#8A7348]/50" />
                <p className="font-editorial italic text-base text-[#9E9587]">
                  No splits recorded. Press L while running to capture telemetry, then click any row to name it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================================
 * 2. HIIT / TABATA INTERVAL ENGINE
 * ============================================================================ */
type HIITPhase = 'warmup' | 'work' | 'rest' | 'cooldown' | 'complete';

function HIITIntervalEngine({ onTitleUpdate }: StopwatchProps) {
  const [warmupSec, setWarmupSec] = useState(10);
  const [workSec, setWorkSec] = useState(20);
  const [restSec, setRestSec] = useState(10);
  const [totalRounds, setTotalRounds] = useState(8);
  const [cooldownSec, setCooldownSec] = useState(30);

  const [phase, setPhase] = useState<HIITPhase>('warmup');
  const [currentRound, setCurrentRound] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [isRunning, setIsRunning] = useState(false);

  const phaseTotalSeconds =
    phase === 'warmup'
      ? warmupSec
      : phase === 'work'
      ? workSec
      : phase === 'rest'
      ? restSec
      : phase === 'cooldown'
      ? cooldownSec
      : 1;

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          if (prev <= 4) {
            soundEngine.playCountdownPip(false);
          }
          return prev - 1;
        }
        // Transition to next phase
        soundEngine.playCountdownPip(true);

        if (phase === 'warmup') {
          setPhase('work');
          return workSec;
        }
        if (phase === 'work') {
          if (currentRound < totalRounds) {
            setPhase('rest');
            return restSec;
          } else if (cooldownSec > 0) {
            setPhase('cooldown');
            return cooldownSec;
          } else {
            setPhase('complete');
            setIsRunning(false);
            soundEngine.playAlarm();
            return 0;
          }
        }
        if (phase === 'rest') {
          setCurrentRound((r) => r + 1);
          setPhase('work');
          return workSec;
        }
        if (phase === 'cooldown') {
          setPhase('complete');
          setIsRunning(false);
          soundEngine.playAlarm();
          return 0;
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, phase, currentRound, totalRounds, warmupSec, workSec, restSec, cooldownSec]);

  useEffect(() => {
    if (isRunning) {
      onTitleUpdate?.(`[${formatTimer(secondsLeft)}] HIIT ${phase.toUpperCase()} R${currentRound}/${totalRounds} — Stopwatch+`);
    }
  }, [isRunning, secondsLeft, phase, currentRound, totalRounds, onTitleUpdate]);

  const applyPreset = (wWarm: number, wWork: number, wRest: number, rds: number, wCool: number) => {
    setIsRunning(false);
    setWarmupSec(wWarm);
    setWorkSec(wWork);
    setRestSec(wRest);
    setTotalRounds(rds);
    setCooldownSec(wCool);
    setPhase(wWarm > 0 ? 'warmup' : 'work');
    setCurrentRound(1);
    setSecondsLeft(wWarm > 0 ? wWarm : wWork);
  };

  const resetHIIT = () => {
    setIsRunning(false);
    setPhase(warmupSec > 0 ? 'warmup' : 'work');
    setCurrentRound(1);
    setSecondsLeft(warmupSec > 0 ? warmupSec : workSec);
    onTitleUpdate?.(null);
  };

  const progress = phaseTotalSeconds > 0 ? ((phaseTotalSeconds - secondsLeft) / phaseTotalSeconds) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full"
    >
      {/* Left: HIIT Ring */}
      <div className="lg:col-span-6 flex flex-col items-center lg:items-start space-y-8">
        <div className="relative w-72 h-72 sm:w-88 sm:h-88 rounded-full glass neo-shadow flex flex-col items-center justify-center overflow-hidden">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(200, 164, 93, 0.15)" strokeWidth="0.6" />
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke={phase === 'work' ? '#E5C687' : phase === 'rest' ? '#10B981' : '#C8A45D'}
              strokeWidth="1.4"
              strokeDasharray="295.3"
              strokeDashoffset={295.3 - (295.3 * progress) / 100}
              strokeLinecap="round"
            />
          </svg>

          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="px-3 py-1 rounded-full bg-[#C8A45D]/20 border border-[#C8A45D]/40 text-[10px] font-mono uppercase tracking-[0.3em] text-[#E5C687] mb-3">
              {phase.toUpperCase()} · ROUND {currentRound} OF {totalRounds}
            </span>
            <span className="text-6xl sm:text-7xl font-mono font-light text-[#F4F1EA] gold-text-glow tabular-nums">
              {formatTimer(secondsLeft)}
            </span>
            <span className="mt-3 text-[10px] font-mono uppercase tracking-[0.25em] text-[#9E9587]">
              3 - 2 - 1 AUDIO CUES ACTIVE
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn-chamfer px-9 py-4 flex items-center space-x-3 cursor-pointer"
          >
            <span className="text-[#C8A45D]">◇</span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F4F1EA]">
              {isRunning ? 'PAUSE HIIT' : 'START HIIT'}
            </span>
          </button>
          <button
            onClick={resetHIIT}
            className="btn-chamfer px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#E5C687] cursor-pointer"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Right: HIIT Configurator */}
      <div className="lg:col-span-6 glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20 space-y-6">
        <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
          <h3 className="font-editorial text-2xl text-[#F4F1EA]">Interval Architecture</h3>
          <div className="flex gap-2">
            <button
              onClick={() => applyPreset(10, 20, 10, 8, 30)}
              className="px-3 py-1 rounded-lg bg-[#C8A45D]/15 border border-[#C8A45D]/35 text-[10px] font-mono text-[#E5C687] cursor-pointer"
            >
              TABATA 20/10×8
            </button>
            <button
              onClick={() => applyPreset(15, 45, 15, 6, 30)}
              className="px-3 py-1 rounded-lg bg-[#C8A45D]/15 border border-[#C8A45D]/35 text-[10px] font-mono text-[#E5C687] cursor-pointer"
            >
              HIIT 45/15×6
            </button>
            <button
              onClick={() => applyPreset(0, 60, 0, 10, 0)}
              className="px-3 py-1 rounded-lg bg-[#C8A45D]/15 border border-[#C8A45D]/35 text-[10px] font-mono text-[#E5C687] cursor-pointer"
            >
              EMOM 60s×10
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Warmup (s)', val: warmupSec, set: setWarmupSec },
            { label: 'Work Sprint (s)', val: workSec, set: setWorkSec },
            { label: 'Rest Recovery (s)', val: restSec, set: setRestSec },
            { label: 'Total Rounds', val: totalRounds, set: setTotalRounds },
            { label: 'Cooldown (s)', val: cooldownSec, set: setCooldownSec },
          ].map((f) => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A7348] block">
                {f.label}
              </label>
              <input
                type="number"
                min={0}
                max={3600}
                value={f.val}
                onChange={(e) => {
                  const v = Math.max(0, Number(e.target.value));
                  f.set(v);
                }}
                className="w-full bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl p-3 text-xs font-mono text-[#F4F1EA]"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================================
 * 3. DUAL CHESS / DEBATE FISCHER CLOCK
 * ============================================================================ */
function ChessClockEngine({ onTitleUpdate }: StopwatchProps) {
  const [baseMinutes, setBaseMinutes] = useState(5);
  const [incrementSec, setIncrementSec] = useState(3);
  const [player1Ms, setPlayer1Ms] = useState(300000);
  const [player2Ms, setPlayer2Ms] = useState(300000);
  const [activePlayer, setActivePlayer] = useState<1 | 2 | null>(null);
  const [moves1, setMoves1] = useState(0);
  const [moves2, setMoves2] = useState(0);

  useEffect(() => {
    if (!activePlayer) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      if (activePlayer === 1) {
        setPlayer1Ms((prev) => {
          if (prev <= delta) {
            setActivePlayer(null);
            soundEngine.playAlarm();
            return 0;
          }
          return prev - delta;
        });
      } else {
        setPlayer2Ms((prev) => {
          if (prev <= delta) {
            setActivePlayer(null);
            soundEngine.playAlarm();
            return 0;
          }
          return prev - delta;
        });
      }
    }, 50);
    return () => clearInterval(id);
  }, [activePlayer]);

  const switchTurn = useCallback(() => {
    soundEngine.playClick();
    if (activePlayer === null) {
      setActivePlayer(1);
    } else if (activePlayer === 1) {
      setPlayer1Ms((m) => m + incrementSec * 1000);
      setMoves1((c) => c + 1);
      setActivePlayer(2);
    } else {
      setPlayer2Ms((m) => m + incrementSec * 1000);
      setMoves2((c) => c + 1);
      setActivePlayer(1);
    }
  }, [activePlayer, incrementSec]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        switchTurn();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [switchTurn]);

  const applyTimeControl = (mins: number, inc: number) => {
    setActivePlayer(null);
    setBaseMinutes(mins);
    setIncrementSec(inc);
    setPlayer1Ms(mins * 60000);
    setPlayer2Ms(mins * 60000);
    setMoves1(0);
    setMoves2(0);
    onTitleUpdate?.(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 w-full"
    >
      {/* Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass p-4 rounded-2xl border border-[#C8A45D]/20">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'BULLET 1+0', m: 1, i: 0 },
            { label: 'BLITZ 3+2', m: 3, i: 2 },
            { label: 'BLITZ 5+3', m: 5, i: 3 },
            { label: 'RAPID 10+5', m: 10, i: 5 },
            { label: 'CLASSICAL 15+10', m: 15, i: 10 },
          ].map((tc) => (
            <button
              key={tc.label}
              onClick={() => applyTimeControl(tc.m, tc.i)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider border cursor-pointer transition-all",
                baseMinutes === tc.m && incrementSec === tc.i
                  ? "bg-[#C8A45D] text-[#0A0908] border-[#E5C687] font-bold"
                  : "bg-[#12100E] text-[#9E9587] border-[#C8A45D]/20 hover:text-[#F4F1EA]"
              )}
            >
              {tc.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#E5C687]">
          PRESS SPACE OR CLICK ACTIVE CLOCK TO PASS TURN (+{incrementSec}s FISCHER INCREMENT)
        </span>
      </div>

      {/* Dual Player Clocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { id: 1 as const, label: 'SOVEREIGN WHITE / SPEAKER I', ms: player1Ms, moves: moves1 },
          { id: 2 as const, label: 'OBSIDIAN BLACK / SPEAKER II', ms: player2Ms, moves: moves2 },
        ].map((p) => {
          const isTurn = activePlayer === p.id;
          return (
            <div
              key={p.id}
              onClick={switchTurn}
              className={cn(
                "p-8 rounded-2xl glass border transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 min-h-[240px]",
                isTurn
                  ? "border-[#E5C687] bg-[#C8A45D]/15 accent-glow scale-[1.01]"
                  : "border-[#C8A45D]/20 opacity-75 hover:opacity-100"
              )}
            >
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C8A45D]">
                {p.label}
              </span>
              <span className="text-5xl sm:text-6xl font-mono font-light text-[#F4F1EA] tabular-nums">
                {formatTime(p.ms)}
              </span>
              <div className="flex items-center space-x-4 text-xs font-mono text-[#9E9587]">
                <span>MOVES: {p.moves}</span>
                <span>•</span>
                <span className={isTurn ? "text-[#E5C687]" : ""}>
                  {isTurn ? 'ACTIVE TURN (CLICK / SPACE)' : 'STANDBY'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
