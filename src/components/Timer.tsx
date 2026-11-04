import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Bell, BellOff } from 'lucide-react';
import { formatTimer, cn } from '../utils';

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
  onClearExternalSeconds?: () => void;
}

export default function Timer({ externalSeconds, onClearExternalSeconds }: TimerProps) {
  const [initialSeconds, setInitialSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('timer_initial_seconds');
    return saved ? Number(saved) : 300;
  });
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const saved = localStorage.getItem('timer_seconds_left');
    return saved ? Number(saved) : 300;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSecs, setCustomSecs] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (externalSeconds && externalSeconds > 0) {
      setInitialSeconds(externalSeconds);
      setSecondsLeft(externalSeconds);
      setIsRunning(true);
      onClearExternalSeconds?.();
    }
  }, [externalSeconds, onClearExternalSeconds]);

  useEffect(() => {
    localStorage.setItem('timer_initial_seconds', String(initialSeconds));
    localStorage.setItem('timer_seconds_left', String(secondsLeft));
  }, [initialSeconds, secondsLeft]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (!isMuted) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsLeft, isMuted]);

  const handleStartPause = useCallback(() => {
    if (secondsLeft === 0) return;
    setIsRunning((prev) => !prev);
  }, [secondsLeft]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  const handlePreset = (seconds: number) => {
    setIsRunning(false);
    setInitialSeconds(seconds);
    setSecondsLeft(seconds);
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
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </svg>

            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-[0.4em] text-[#8A7348] font-semibold mb-3">
                REMAINING RESERVOIR
              </span>
              <motion.span 
                key={secondsLeft}
                initial={{ scale: 0.98, opacity: 0.9 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl sm:text-6xl md:text-7xl font-mono font-light tracking-tight tabular-nums text-[#F4F1EA] gold-text-glow"
              >
                {formatTimer(secondsLeft)}
              </motion.span>
              <span className="mt-4 text-[10px] font-mono text-[#E5C687] uppercase tracking-[0.3em]">
                {Math.round(100 - progress)}% REMAINING
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
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute Chime" : "Mute Chime"}
            className="p-4 rounded-xl glass text-[#9E9587] hover:text-[#E5C687] transition-all cursor-pointer"
          >
            {isMuted ? <BellOff size={18} /> : <Bell size={18} className="text-[#C8A45D]" />}
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
                  onClick={() => handlePreset(preset.seconds)}
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
              Bespoke Duration
            </label>
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
