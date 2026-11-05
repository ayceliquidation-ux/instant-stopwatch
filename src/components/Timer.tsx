import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  Share2,
  Check,
  Plus,
  Trash2,
  Play,
  Pause,
  CalendarClock,
  Hash,
  TrendingUp,
  Delete,
} from 'lucide-react';
import { formatTimer, cn } from '../utils';
import { soundEngine } from '../utils/soundEngine';

const PRESETS = [
  { label: '1 MIN', seconds: 60 },
  { label: '3 MIN', seconds: 180 },
  { label: '5 MIN', seconds: 300 },
  { label: '10 MIN', seconds: 600 },
  { label: '15 MIN', seconds: 900 },
  { label: '30 MIN', seconds: 1800 },
  { label: '45 MIN', seconds: 2700 },
  { label: '1 HR', seconds: 3600 },
];

interface QueuedTimer {
  id: string;
  label: string;
  initialSeconds: number;
  secondsLeft: number;
  overtimeSeconds: number;
  isRunning: boolean;
  endTimestamp: number | null;
}

interface TimerProps {
  externalSeconds?: number | null;
  externalLabel?: string | null;
  onClearExternalSeconds?: () => void;
  onTitleUpdate?: (title: string | null) => void;
}

function parseDigitStringToSeconds(digits: string): number {
  const padded = digits.padStart(6, '0').slice(-6);
  const hh = parseInt(padded.slice(0, 2), 10);
  const mm = parseInt(padded.slice(2, 4), 10);
  const ss = parseInt(padded.slice(4, 6), 10);
  return hh * 3600 + mm * 60 + ss;
}

function formatDigitBuffer(digits: string): string {
  const padded = digits.padStart(6, '0').slice(-6);
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
}

export default function Timer({
  externalSeconds,
  externalLabel,
  onClearExternalSeconds,
  onTitleUpdate,
}: TimerProps) {
  const [initialSeconds, setInitialSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('timer_initial_seconds');
    return saved ? Number(saved) : 300;
  });
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const saved = localStorage.getItem('timer_seconds_left');
    return saved ? Number(saved) : 300;
  });
  const [timerLabel, setTimerLabel] = useState<string>(() => {
    return localStorage.getItem('timer_label') || 'Primary Countdown';
  });
  const [isRunning, setIsRunning] = useState(false);

  // Overtime Count-Up Mode
  const [overtimeEnabled, setOvertimeEnabled] = useState<boolean>(() => {
    return localStorage.getItem('timer_overtime_enabled') === 'true';
  });
  const [inOvertime, setInOvertime] = useState(false);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);

  // Direct Numpad Entry Mode
  const [isEditingDigits, setIsEditingDigits] = useState(false);
  const [digitBuffer, setDigitBuffer] = useState('');

  // Target Clock / Event Time Mode
  const [targetMode, setTargetMode] = useState<'duration' | 'targetClock'>('duration');
  const [targetTimeStr, setTargetTimeStr] = useState('17:00');
  const [targetDateStr, setTargetDateStr] = useState('');

  // Simultaneous Multi-Timer Queue (Up to 8 timers)
  const [multiTimers, setMultiTimers] = useState<QueuedTimer[]>(() => {
    try {
      const saved = localStorage.getItem('timer_multi_queue');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [newQueueLabel, setNewQueueLabel] = useState('');
  const [newQueueMin, setNewQueueMin] = useState('5');
  const [newQueueSec, setNewQueueSec] = useState('0');

  const [copiedLink, setCopiedLink] = useState(false);
  const endTimestampRef = useRef<number | null>(null);
  const overtimeStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (externalSeconds && externalSeconds > 0) {
      setInitialSeconds(externalSeconds);
      setSecondsLeft(externalSeconds);
      setInOvertime(false);
      setOvertimeSeconds(0);
      if (externalLabel) setTimerLabel(externalLabel);
      endTimestampRef.current = Date.now() + externalSeconds * 1000;
      setIsRunning(true);
      onClearExternalSeconds?.();
    }
  }, [externalSeconds, externalLabel, onClearExternalSeconds]);

  useEffect(() => {
    localStorage.setItem('timer_initial_seconds', String(initialSeconds));
    localStorage.setItem('timer_seconds_left', String(secondsLeft));
    localStorage.setItem('timer_label', timerLabel);
    localStorage.setItem('timer_overtime_enabled', String(overtimeEnabled));
  }, [initialSeconds, secondsLeft, timerLabel, overtimeEnabled]);

  useEffect(() => {
    localStorage.setItem('timer_multi_queue', JSON.stringify(multiTimers));
  }, [multiTimers]);

  // Primary Timer + Overtime Loop (Zero-Drift Date.now())
  useEffect(() => {
    if (!isRunning) {
      endTimestampRef.current = null;
      overtimeStartRef.current = null;
      return;
    }

    if (!inOvertime && !endTimestampRef.current) {
      endTimestampRef.current = Date.now() + secondsLeft * 1000;
    }

    const interval = window.setInterval(() => {
      const now = Date.now();

      if (!inOvertime && endTimestampRef.current) {
        const remainingMs = endTimestampRef.current - now;
        if (remainingMs <= 0) {
          setSecondsLeft(0);
          soundEngine.playAlarm();
          soundEngine.notify(
            'Timer Complete — Stopwatch+',
            `${timerLabel} (${formatTimer(initialSeconds)}) has reached 00:00.`
          );

          if (overtimeEnabled) {
            setInOvertime(true);
            overtimeStartRef.current = now;
            setOvertimeSeconds(0);
          } else {
            setIsRunning(false);
            endTimestampRef.current = null;
          }
        } else {
          setSecondsLeft(Math.ceil(remainingMs / 1000));
        }
      } else if (inOvertime && overtimeStartRef.current) {
        const elapsedOverMs = now - overtimeStartRef.current;
        setOvertimeSeconds(Math.floor(elapsedOverMs / 1000));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, inOvertime, overtimeEnabled, initialSeconds, timerLabel]);

  // Multi-Timer Queue Loop
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      setMultiTimers((prev) =>
        prev.map((q) => {
          if (!q.isRunning) return q;
          const target = q.endTimestamp || now + q.secondsLeft * 1000;
          const remMs = target - now;
          if (remMs > 0) {
            return { ...q, secondsLeft: Math.ceil(remMs / 1000), endTimestamp: target };
          }
          if (q.secondsLeft > 0) {
            soundEngine.playAlarm();
            soundEngine.notify('Queued Timer Complete', `${q.label} finished!`);
          }
          if (overtimeEnabled) {
            const overSec = Math.floor(Math.abs(remMs) / 1000);
            return { ...q, secondsLeft: 0, overtimeSeconds: overSec, endTimestamp: target };
          }
          return { ...q, secondsLeft: 0, isRunning: false, endTimestamp: null };
        })
      );
    }, 250);
    return () => clearInterval(id);
  }, [overtimeEnabled]);

  // Dynamic Tab Title
  useEffect(() => {
    if (isRunning) {
      if (inOvertime) {
        onTitleUpdate?.(`[+${formatTimer(overtimeSeconds)} OVERTIME] ${timerLabel} — Stopwatch+`);
      } else {
        onTitleUpdate?.(`[${formatTimer(secondsLeft)}] ${timerLabel} — Stopwatch+`);
      }
    } else {
      const runningQ = multiTimers.find((m) => m.isRunning);
      if (runningQ) {
        onTitleUpdate?.(`[${formatTimer(runningQ.secondsLeft)}] ${runningQ.label} — Stopwatch+`);
      } else {
        onTitleUpdate?.(null);
      }
    }
  }, [isRunning, inOvertime, overtimeSeconds, secondsLeft, timerLabel, multiTimers, onTitleUpdate]);

  const handleStartPause = useCallback(() => {
    if (isEditingDigits) {
      const parsed = parseDigitStringToSeconds(digitBuffer);
      if (parsed > 0) {
        setInitialSeconds(parsed);
        setSecondsLeft(parsed);
      }
      setIsEditingDigits(false);
    }
    if (secondsLeft === 0 && !inOvertime) return;
    soundEngine.playClick();
    setIsRunning((prev) => {
      const next = !prev;
      if (next) {
        if (inOvertime) {
          overtimeStartRef.current = Date.now() - overtimeSeconds * 1000;
        } else {
          endTimestampRef.current = Date.now() + secondsLeft * 1000;
        }
      } else {
        endTimestampRef.current = null;
      }
      return next;
    });
  }, [secondsLeft, inOvertime, overtimeSeconds, isEditingDigits, digitBuffer]);

  const handleReset = useCallback(() => {
    soundEngine.playClick();
    setIsRunning(false);
    setInOvertime(false);
    setOvertimeSeconds(0);
    endTimestampRef.current = null;
    overtimeStartRef.current = null;
    setSecondsLeft(initialSeconds);
    onTitleUpdate?.(null);
  }, [initialSeconds, onTitleUpdate]);

  const handlePreset = (seconds: number, labelText?: string) => {
    soundEngine.playClick();
    setIsRunning(false);
    setInOvertime(false);
    setOvertimeSeconds(0);
    setIsEditingDigits(false);
    endTimestampRef.current = null;
    setInitialSeconds(seconds);
    setSecondsLeft(seconds);
    if (labelText) setTimerLabel(labelText);
  };

  // Live Quick-Add Chips (+15s, +1m, +5m, +15m) that work even while running
  const addLiveSeconds = (addSec: number) => {
    soundEngine.playClick();
    if (inOvertime) {
      setInOvertime(false);
      setOvertimeSeconds(0);
      setSecondsLeft(addSec);
      setInitialSeconds((prev) => prev + addSec);
      if (isRunning) {
        endTimestampRef.current = Date.now() + addSec * 1000;
      }
      return;
    }
    setSecondsLeft((prev) => {
      const next = prev + addSec;
      setInitialSeconds((init) => Math.max(init, next));
      if (isRunning && endTimestampRef.current) {
        endTimestampRef.current += addSec * 1000;
      }
      return next;
    });
  };

  // Numpad Digit Entry
  const pressNumpadDigit = (digit: string) => {
    soundEngine.playClick();
    setIsRunning(false);
    setIsEditingDigits(true);
    setDigitBuffer((prev) => {
      const next = (prev + digit).replace(/^0+/, '').slice(0, 6);
      return next;
    });
  };

  const backspaceDigit = () => {
    soundEngine.playClick();
    setDigitBuffer((prev) => prev.slice(0, -1));
  };

  const applyDigitBuffer = () => {
    const secs = parseDigitStringToSeconds(digitBuffer);
    if (secs > 0) {
      handlePreset(secs);
    }
    setIsEditingDigits(false);
    setDigitBuffer('');
  };

  // Target Clock / Event Time Calculation
  const applyTargetClock = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    let target: Date;
    if (targetDateStr) {
      target = new Date(`${targetDateStr}T${targetTimeStr || '00:00'}:00`);
    } else {
      const [hh, mm] = (targetTimeStr || '17:00').split(':').map(Number);
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1); // Next day if time already passed today
      }
    }
    const diffSec = Math.max(1, Math.floor((target.getTime() - now.getTime()) / 1000));
    handlePreset(diffSec, `Until ${targetDateStr ? `${targetDateStr} ` : ''}${targetTimeStr}`);
    setIsRunning(true);
    endTimestampRef.current = target.getTime();
  };

  // Add to Simultaneous Multi-Timer Queue (max 8)
  const addQueuedTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (multiTimers.length >= 8) return;
    const total = parseInt(newQueueMin || '0', 10) * 60 + parseInt(newQueueSec || '0', 10);
    if (total <= 0) return;
    soundEngine.playClick();
    const item: QueuedTimer = {
      id: Math.random().toString(36).substring(2, 9),
      label: newQueueLabel.trim() || `Channel #${multiTimers.length + 1}`,
      initialSeconds: total,
      secondsLeft: total,
      overtimeSeconds: 0,
      isRunning: true,
      endTimestamp: Date.now() + total * 1000,
    };
    setMultiTimers((prev) => [item, ...prev]);
    setNewQueueLabel('');
  };

  const toggleQueuedTimer = (id: string) => {
    soundEngine.playClick();
    setMultiTimers((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const next = !q.isRunning;
        return {
          ...q,
          isRunning: next,
          endTimestamp: next ? Date.now() + q.secondsLeft * 1000 : null,
        };
      })
    );
  };

  const resetQueuedTimer = (id: string) => {
    soundEngine.playClick();
    setMultiTimers((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              isRunning: false,
              secondsLeft: q.initialSeconds,
              overtimeSeconds: 0,
              endTimestamp: null,
            }
          : q
      )
    );
  };

  const removeQueuedTimer = (id: string) => {
    setMultiTimers((prev) => prev.filter((q) => q.id !== id));
  };

  const copyShareableUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'timer');
    url.searchParams.set('duration', String(initialSeconds));
    url.searchParams.set('label', timerLabel);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (isEditingDigits) {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          pressNumpadDigit(e.key);
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          backspaceDigit();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          applyDigitBuffer();
          return;
        }
        if (e.key === 'Escape') {
          setIsEditingDigits(false);
          setDigitBuffer('');
          return;
        }
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
  }, [handleStartPause, handleReset, isEditingDigits, digitBuffer]);

  const progress =
    inOvertime
      ? 100
      : initialSeconds > 0
      ? ((initialSeconds - secondsLeft) / initialSeconds) * 100
      : 0;

  return (
    <div className="space-y-12 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full">
        {/* Left/Center Countdown Dial & Live Quick-Add Chips */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start space-y-8">
          <div className="relative flex items-center justify-center p-2">
            <div
              className={cn(
                "absolute inset-0 rounded-full blur-[70px] pointer-events-none transition-colors duration-500",
                inOvertime ? "bg-red-500/20 animate-pulse" : "bg-[#C8A45D]/[0.06]"
              )}
            />

            <div
              className={cn(
                "relative w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 rounded-full glass neo-shadow flex flex-col items-center justify-center overflow-hidden transition-all",
                inOvertime && "border-red-500/50"
              )}
            >
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
                  stroke={inOvertime ? '#EF4444' : '#C8A45D'}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeDasharray="298.45"
                  animate={{ strokeDashoffset: 298.45 - (298.45 * progress) / 100 }}
                  transition={{ duration: 0.25, ease: "linear" }}
                />
              </svg>

              <div className="relative z-10 flex flex-col items-center px-6 text-center">
                <input
                  type="text"
                  value={timerLabel}
                  onChange={(e) => setTimerLabel(e.target.value)}
                  className="bg-transparent text-center text-[10px] uppercase tracking-[0.35em] text-[#C8A45D] font-semibold mb-2 border-b border-transparent hover:border-[#C8A45D]/40 focus:border-[#E5C687] focus:outline-none"
                  title="Click to rename timer"
                />

                {/* Clickable HH:MM:SS for Direct Numpad / Keyboard Entry */}
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setIsEditingDigits(true);
                    setDigitBuffer('');
                  }}
                  title="Click to type HH:MM:SS directly on keyboard or numpad"
                  className="cursor-pointer group"
                >
                  {isEditingDigits ? (
                    <span className="text-4xl sm:text-5xl md:text-6xl font-mono font-light tracking-tight tabular-nums text-[#E5C687] border-b-2 border-[#C8A45D] animate-pulse">
                      {formatDigitBuffer(digitBuffer)}
                    </span>
                  ) : inOvertime ? (
                    <span className="text-5xl sm:text-6xl font-mono font-light tracking-tight tabular-nums text-red-400 animate-pulse">
                      +{formatTimer(overtimeSeconds)}
                    </span>
                  ) : (
                    <span className="text-5xl sm:text-6xl md:text-7xl font-mono font-light tracking-tight tabular-nums text-[#F4F1EA] gold-text-glow group-hover:text-[#E5C687] transition-colors">
                      {formatTimer(secondsLeft)}
                    </span>
                  )}
                </button>

                <span
                  className={cn(
                    "mt-3 text-[10px] font-mono uppercase tracking-[0.28em]",
                    inOvertime ? "text-red-400 font-bold" : "text-[#E5C687]"
                  )}
                >
                  {isEditingDigits
                    ? 'TYPE DIGITS (HH:MM:SS) · PRESS ENTER'
                    : inOvertime
                    ? 'OVERTIME ELAPSED'
                    : `${Math.round(100 - progress)}% RESERVOIR · CLICK DIGITS TO TYPE`}
                </span>

                {/* Live Quick-Add Chips (+15s, +1m, +5m, +15m) */}
                <div className="mt-5 flex items-center space-x-2">
                  {[
                    { label: '+15s', sec: 15 },
                    { label: '+1m', sec: 60 },
                    { label: '+5m', sec: 300 },
                    { label: '+15m', sec: 900 },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => addLiveSeconds(chip.sec)}
                      className="px-2.5 py-1 rounded-full bg-[#C8A45D]/15 border border-[#C8A45D]/35 text-[10px] font-mono text-[#E5C687] hover:bg-[#C8A45D] hover:text-[#0A0908] transition-all cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Chamfered Controls */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleStartPause}
              className="btn-chamfer px-9 py-4 flex items-center space-x-3 cursor-pointer min-w-[170px] justify-center"
            >
              <span className="text-[#C8A45D] text-sm">◇</span>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F4F1EA]">
                {isRunning ? 'PAUSE' : 'START TIMER'}
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="btn-chamfer px-5 py-4 flex items-center space-x-2 cursor-pointer text-[#E5C687]"
            >
              <RotateCcw size={14} className="text-[#C8A45D]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">RESET</span>
            </motion.button>

            <button
              onClick={() => setOvertimeEnabled(!overtimeEnabled)}
              title="When enabled, timer flashes and counts UP (+00:01:24 OVERTIME) after hitting 00:00"
              className={cn(
                "px-4 py-4 rounded-xl border text-[10px] font-mono uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer",
                overtimeEnabled
                  ? "bg-[#C8A45D]/20 border-[#C8A45D] text-[#E5C687]"
                  : "glass border-[#C8A45D]/20 text-[#9E9587]"
              )}
            >
              <TrendingUp size={14} className="text-[#C8A45D]" />
              <span>OVERTIME: {overtimeEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={copyShareableUrl}
              className="p-4 rounded-xl glass text-[#E5C687] hover:border-[#C8A45D] transition-all cursor-pointer"
              title="Copy Shareable Deep-Link URL"
            >
              {copiedLink ? <Check size={15} /> : <Share2 size={15} className="text-[#C8A45D]" />}
            </button>
          </div>
        </div>

        {/* Right Column: Direct Numpad, Presets & Target Clock Mode */}
        <div className="lg:col-span-6 w-full space-y-6">
          <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20 space-y-5">
            {/* Mode Switcher: Duration / Numpad vs Target Clock */}
            <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-[#C8A45D] text-xs">◆</span>
                <h3 className="font-editorial text-xl text-[#F4F1EA]">
                  {targetMode === 'duration' ? 'Direct Horological Numpad & Presets' : 'Target Event & Clock Countdown'}
                </h3>
              </div>
              <div className="flex rounded-xl bg-[#0A0908] p-1 border border-[#C8A45D]/25">
                <button
                  onClick={() => setTargetMode('duration')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider cursor-pointer flex items-center space-x-1",
                    targetMode === 'duration' ? "bg-[#C8A45D] text-[#0A0908] font-bold" : "text-[#9E9587]"
                  )}
                >
                  <Hash size={11} />
                  <span>NUMPAD</span>
                </button>
                <button
                  onClick={() => setTargetMode('targetClock')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider cursor-pointer flex items-center space-x-1",
                    targetMode === 'targetClock' ? "bg-[#C8A45D] text-[#0A0908] font-bold" : "text-[#9E9587]"
                  )}
                >
                  <CalendarClock size={11} />
                  <span>TARGET TIME</span>
                </button>
              </div>
            </div>

            {targetMode === 'duration' ? (
              <div className="space-y-5">
                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePreset(preset.seconds, `${preset.label} Timer`)}
                      className={cn(
                        "py-2.5 px-2 rounded-xl text-[10px] font-mono font-semibold uppercase tracking-[0.15em] transition-all border cursor-pointer",
                        initialSeconds === preset.seconds
                          ? "bg-[#C8A45D]/20 border-[#C8A45D] text-[#E5C687]"
                          : "bg-[#12100E]/80 border-[#C8A45D]/15 text-[#9E9587] hover:text-[#F4F1EA]"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* On-Screen Direct Numpad (`00:00:01` to `99:59:59`) */}
                <div className="p-4 rounded-xl bg-[#0A0908]/80 border border-[#C8A45D]/20 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#8A7348]">
                      DIRECT ENTRY BUFFER (HH:MM:SS)
                    </span>
                    <span className="text-[#E5C687] font-semibold">
                      {formatDigitBuffer(digitBuffer)}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => pressNumpadDigit(d)}
                        className="py-2.5 rounded-lg bg-[#12100E] border border-[#C8A45D]/20 text-xs font-mono text-[#F4F1EA] hover:border-[#C8A45D] hover:text-[#E5C687] transition-all cursor-pointer"
                      >
                        {d}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={backspaceDigit}
                      className="py-2.5 rounded-lg bg-[#12100E] border border-[#C8A45D]/20 text-xs font-mono text-[#9E9587] hover:text-red-400 flex items-center justify-center cursor-pointer"
                      title="Backspace"
                    >
                      <Delete size={14} />
                    </button>
                  </div>

                  {digitBuffer.length > 0 && (
                    <button
                      type="button"
                      onClick={applyDigitBuffer}
                      className="btn-chamfer w-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E5C687] cursor-pointer"
                    >
                      SET {formatDigitBuffer(digitBuffer)}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Target Clock / Event Time Mode */
              <form onSubmit={applyTargetClock} className="space-y-4">
                <p className="text-xs text-[#9E9587]">
                  Count down to a specific wall-clock time today (e.g., 17:00) or a future event date.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A7348] block mb-1">
                      Target Time (24h)
                    </label>
                    <input
                      type="time"
                      value={targetTimeStr}
                      onChange={(e) => setTargetTimeStr(e.target.value)}
                      className="w-full bg-[#0A0908] border border-[#C8A45D]/30 rounded-xl p-3 text-xs font-mono text-[#F4F1EA]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A7348] block mb-1">
                      Optional Future Date
                    </label>
                    <input
                      type="date"
                      value={targetDateStr}
                      onChange={(e) => setTargetDateStr(e.target.value)}
                      className="w-full bg-[#0A0908] border border-[#C8A45D]/30 rounded-xl p-3 text-xs font-mono text-[#F4F1EA]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-chamfer w-full py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#F4F1EA] cursor-pointer"
                >
                  ◇ LOCK TARGET COUNTDOWN
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Simultaneous Multi-Timer Queue (Up to 8 Independent Named Timers) */}
      <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C8A45D]/15 pb-4">
          <div className="flex items-center space-x-2.5">
            <span className="text-[#C8A45D] text-xs">◆</span>
            <h3 className="font-editorial text-2xl text-[#F4F1EA]">
              Simultaneous Multi-Timer Queue
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#C8A45D]/15 text-[#E5C687] border border-[#C8A45D]/30">
              {multiTimers.length} / 8 CHANNELS
            </span>
          </div>

          <form onSubmit={addQueuedTimer} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Timer Label (e.g. Lab Sample B)"
              value={newQueueLabel}
              onChange={(e) => setNewQueueLabel(e.target.value)}
              className="bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl px-3.5 py-2 text-xs text-[#F4F1EA] placeholder-[#8A7348]/60 focus:outline-none focus:border-[#C8A45D]"
            />
            <input
              type="number"
              min={0}
              max={999}
              value={newQueueMin}
              onChange={(e) => setNewQueueMin(e.target.value)}
              className="w-16 bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl px-2.5 py-2 text-xs font-mono text-[#F4F1EA]"
              title="Minutes"
            />
            <span className="text-[#C8A45D] font-mono text-xs">m</span>
            <input
              type="number"
              min={0}
              max={59}
              value={newQueueSec}
              onChange={(e) => setNewQueueSec(e.target.value)}
              className="w-16 bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl px-2.5 py-2 text-xs font-mono text-[#F4F1EA]"
              title="Seconds"
            />
            <span className="text-[#C8A45D] font-mono text-xs">s</span>
            <button
              type="submit"
              disabled={multiTimers.length >= 8}
              className="btn-chamfer px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E5C687] flex items-center space-x-1 cursor-pointer disabled:opacity-40"
            >
              <Plus size={13} />
              <span>ADD TIMER</span>
            </button>
          </form>
        </div>

        {multiTimers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence initial={false}>
              {multiTimers.map((q) => {
                const pct =
                  q.initialSeconds > 0
                    ? ((q.initialSeconds - q.secondsLeft) / q.initialSeconds) * 100
                    : 100;
                const isOver = q.secondsLeft === 0 && q.overtimeSeconds > 0;
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "p-4 rounded-2xl bg-[#12100E]/90 border flex flex-col justify-between space-y-3",
                      isOver ? "border-red-500/50" : "border-[#C8A45D]/25"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#E5C687] truncate">
                        {q.label}
                      </span>
                      <button
                        onClick={() => removeQueuedTimer(q.id)}
                        className="text-[#8A7348] hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="text-2xl font-mono font-light text-[#F4F1EA] tabular-nums">
                      {isOver ? (
                        <span className="text-red-400 animate-pulse">
                          +{formatTimer(q.overtimeSeconds)}
                        </span>
                      ) : (
                        formatTimer(q.secondsLeft)
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 rounded-full bg-[#C8A45D]/15 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          isOver ? "bg-red-500" : "bg-[#C8A45D]"
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-[#8A7348]">
                        TOTAL {formatTimer(q.initialSeconds)}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => toggleQueuedTimer(q.id)}
                          className="p-2 rounded-lg bg-[#C8A45D]/15 text-[#E5C687] hover:bg-[#C8A45D] hover:text-[#0A0908] transition-colors cursor-pointer"
                        >
                          {q.isRunning ? <Pause size={13} /> : <Play size={13} />}
                        </button>
                        <button
                          onClick={() => resetQueuedTimer(q.id)}
                          className="p-2 rounded-lg glass text-[#9E9587] hover:text-[#F4F1EA] cursor-pointer"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-center py-6 font-editorial italic text-base text-[#9E9587]">
            Add up to 8 independent named countdown channels above to run simultaneously alongside the primary dial.
          </p>
        )}
      </div>
    </div>
  );
}
