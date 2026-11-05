import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Share2, Check } from 'lucide-react';
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

interface TimerProps {
  externalSeconds?: number | null;
  externalLabel?: string | null;
  onClearExternalSeconds?: () => void;
  onTitleUpdate?: (title: string | null) => void;
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
    return localStorage.getItem('timer_label') || 'Countdown';
  });
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSecs, setCustomSecs] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const endTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (externalSeconds && externalSeconds > 0) {
      setInitialSeconds(externalSeconds);
      setSecondsLeft(externalSeconds);
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
  }, [initialSeconds, secondsLeft, timerLabel]);

  // Zero-Drift Date.now() delta countdown
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
      const remainingMs = endTimestampRef.current - Date.now();
      if (remainingMs <= 0) {
        setSecondsLeft(0);
        setIsRunning(false);
        endTimestampRef.current = null;
        soundEngine.playAlarm();
        soundEngine.notify('Timer Complete — Stopwatch+', `${timerLabel} (${formatTimer(initialSeconds)}) has finished.`);
      } else {
        setSecondsLeft(Math.ceil(remainingMs / 1000));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, initialSeconds, timerLabel]);

  useEffect(() => {
    if (isRunning) {
      onTitleUpdate?.(`[${formatTimer(secondsLeft)}] ${timerLabel} — Stopwatch+`);
    } else if (secondsLeft === 0) {
      onTitleUpdate?.(`[00:00 DONE] ${timerLabel} — Stopwatch+`);
    } else {
      onTitleUpdate?.(null);
    }
  }, [isRunning, secondsLeft, timerLabel, onTitleUpdate]);

  const handleStartPause = useCallback(() => {
    if (secondsLeft === 0) return;
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
    setSecondsLeft(initialSeconds);
    onTitleUpdate?.(null);
  }, [initialSeconds, onTitleUpdate]);

  const handlePreset = (seconds: number, labelText?: string) => {
    soundEngine.playClick();
    setIsRunning(false);
    endTimestampRef.current = null;
    setInitialSeconds(seconds);
    setSecondsLeft(seconds);
    if (labelText) setTimerLabel(labelText);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes || '0', 10);
    const secs = parseInt(customSecs || '0', 10);
    const total = mins * 60 + secs;
    if (total > 0) {
      handlePreset(total);
      setCustomMinutes('');
      setCustomSecs('');
    }
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

  const progress = initialSeconds > 0 ? ((initialSeconds - secondsLeft) / initialSeconds) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
      {/* Left/Center Countdown Dial */}
      <div className="lg:col-span-7 flex flex-col items-center lg:items-start space-y-10">
        <div className="relative flex items-center justify-center p-4">
          <div className="absolute inset-0 rounded-full bg-[#C8A45D]/[0.06] blur-[70px] pointer-events-none" />

          <div className="relative w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 rounded-full glass neo-shadow flex flex-col items-center justify-center overflow-hidden">
            <div 
              className="absolute inset-0 bg-center bg-cover opacity-[0.12] mix-blend-screen pointer-events-none"
              style={{ backgroundImage: `url('/emblem.jpg')` }}
            />

            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="47.5"
                fill="none"
                stroke="rgba(200, 164, 93, 0.14)"
                strokeWidth="0.4"
              />
              <circle
                cx="50"
                cy="50"
                r="45.5"
                fill="none"
                stroke="rgba(200, 164, 93, 0.22)"
                strokeWidth="0.6"
                strokeDasharray="0.5 4.26"
              />
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

            <div className="relative z-10 flex flex-col items-center px-6 text-center">
              <input
                type="text"
                value={timerLabel}
                onChange={(e) => setTimerLabel(e.target.value)}
                className="bg-transparent text-center text-[10px] uppercase tracking-[0.35em] text-[#C8A45D] font-semibold mb-3 border-b border-transparent hover:border-[#C8A45D]/40 focus:border-[#E5C687] focus:outline-none"
                title="Click to edit timer label"
              />
              <motion.span 
                key={secondsLeft}
                initial={{ scale: 0.98, opacity: 0.9 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl sm:text-6xl md:text-7xl font-mono font-light tracking-tight tabular-nums text-[#F4F1EA] gold-text-glow"
              >
                {formatTimer(secondsLeft)}
              </motion.span>
              <span className="mt-4 text-[10px] font-mono text-[#E5C687] uppercase tracking-[0.3em]">
                {Math.round(100 - progress)}% RESERVOIR
              </span>
            </div>
          </div>
        </div>

        {/* Chamfered Controls */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleStartPause}
            disabled={secondsLeft === 0}
            className="btn-chamfer px-9 py-4 flex items-center space-x-3 cursor-pointer min-w-[175px] justify-center disabled:opacity-40"
          >
            <span className="text-[#C8A45D] text-sm">◇</span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F4F1EA]">
              {isRunning ? 'PAUSE' : 'START TIMER'}
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            title="Reset Timer (R)"
            className="btn-chamfer px-6 py-4 flex items-center space-x-2.5 cursor-pointer text-[#E5C687]"
          >
            <RotateCcw size={15} className="text-[#C8A45D]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">RESET</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={copyShareableUrl}
            title="Copy deep-link URL to this exact timer"
            className="px-4 py-4 rounded-xl glass text-[#E5C687] hover:border-[#C8A45D] transition-all cursor-pointer flex items-center space-x-2 text-[10px] font-mono uppercase tracking-wider"
          >
            {copiedLink ? <Check size={15} /> : <Share2 size={15} className="text-[#C8A45D]" />}
            <span>{copiedLink ? 'LINK COPIED' : 'SHARE TIMER LINK'}</span>
          </motion.button>
        </div>
      </div>

      {/* Right Column: Presets & Custom Interval */}
      <div className="lg:col-span-5 w-full space-y-6">
        <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20">
          <div className="flex items-center space-x-2 pb-4 mb-5 border-b border-[#C8A45D]/15">
            <span className="text-[#C8A45D] text-xs">◆</span>
            <h3 className="font-editorial text-xl text-[#F4F1EA] tracking-wide">
              Calibrated Intervals
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESETS.map((preset) => {
              const active = initialSeconds === preset.seconds;
              return (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset.seconds, `${preset.label} Timer`)}
                  className={cn(
                    "py-3.5 px-3 rounded-xl text-[11px] font-mono font-semibold uppercase tracking-[0.18em] transition-all border cursor-pointer",
                    active
                      ? "bg-[#C8A45D]/20 border-[#C8A45D] text-[#E5C687] accent-glow"
                      : "bg-[#12100E]/80 border-[#C8A45D]/15 text-[#9E9587] hover:border-[#C8A45D]/40 hover:text-[#F4F1EA]"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Duration Input */}
          <form onSubmit={handleCustomSubmit} className="mt-6 pt-6 border-t border-[#C8A45D]/15 space-y-3">
            <label className="block text-[10px] uppercase tracking-[0.28em] text-[#8A7348] font-semibold">
              Bespoke Duration & Label
            </label>
            <input
              type="text"
              placeholder="Session Label (e.g. Exam, Pitch, Meditation)"
              value={timerLabel}
              onChange={(e) => setTimerLabel(e.target.value)}
              className="w-full bg-[#0A0908]/90 border border-[#C8A45D]/25 rounded-xl px-4 py-2.5 text-xs text-[#F4F1EA] placeholder-[#8A7348]/60 focus:outline-none focus:border-[#C8A45D]"
            />
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={999}
                placeholder="Min"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-full bg-[#0A0908]/90 border border-[#C8A45D]/25 rounded-xl px-4 py-3 text-xs font-mono text-[#F4F1EA] placeholder-[#8A7348]/60 focus:outline-none focus:border-[#C8A45D]"
              />
              <span className="text-[#C8A45D] font-mono">:</span>
              <input
                type="number"
                min={0}
                max={59}
                placeholder="Sec"
                value={customSecs}
                onChange={(e) => setCustomSecs(e.target.value)}
                className="w-full bg-[#0A0908]/90 border border-[#C8A45D]/25 rounded-xl px-4 py-3 text-xs font-mono text-[#F4F1EA] placeholder-[#8A7348]/60 focus:outline-none focus:border-[#C8A45D]"
              />
              <button
                type="submit"
                className="btn-chamfer px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E5C687] shrink-0 cursor-pointer"
              >
                SET
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
