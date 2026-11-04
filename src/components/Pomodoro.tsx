import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Coffee, Brain } from 'lucide-react';
import { formatTimer, cn } from '../utils';

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

const MODES: Record<PomodoroMode, { label: string; subtitle: string; seconds: number }> = {
  work: { label: 'DEEP FOCUS', subtitle: '25 Minute Cognitive Immersion', seconds: 1500 },
  shortBreak: { label: 'SHORT REST', subtitle: '5 Minute Decompression', seconds: 300 },
  longBreak: { label: 'GRAND INTERMISSION', subtitle: '15 Minute Restoration', seconds: 900 },
};

export default function Pomodoro() {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [secondsLeft, setSecondsLeft] = useState(MODES.work.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState<number>(() => {
    const saved = localStorage.getItem('pomodoro_sessions');
    return saved ? Number(saved) : 0;
  });
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('pomodoro_sessions', String(sessions));
  }, [sessions]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      if (mode === 'work') {
        const nextSessionCount = sessions + 1;
        setSessions(nextSessionCount);
        const nextMode = nextSessionCount % 4 === 0 ? 'longBreak' : 'shortBreak';
        setMode(nextMode);
        setSecondsLeft(MODES[nextMode].seconds);
      } else {
        setMode('work');
        setSecondsLeft(MODES.work.seconds);
      }
      
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsLeft, mode, sessions]);

  const handleStartPause = useCallback(() => setIsRunning((prev) => !prev), []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(MODES[mode].seconds);
  }, [mode]);

  const switchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setSecondsLeft(MODES[newMode].seconds);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
      {/* Left/Center Focus Dial */}
      <div className="lg:col-span-7 flex flex-col items-center lg:items-start space-y-10">
        <div className="relative flex items-center justify-center p-4">
          <div className="absolute inset-0 rounded-full bg-[#C8A45D]/[0.06] blur-[75px] pointer-events-none" />
          
          <div className="relative w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 rounded-full glass neo-shadow flex flex-col items-center justify-center overflow-hidden">
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
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </svg>

            <div className="z-10 flex flex-col items-center">
              <div className="p-3 rounded-full bg-[#C8A45D]/10 border border-[#C8A45D]/30 text-[#E5C687] mb-3">
                {mode === 'work' ? <Brain size={22} /> : <Coffee size={22} />}
              </div>
              <span className="text-[9px] uppercase tracking-[0.35em] text-[#C8A45D] font-semibold mb-2">
                {MODES[mode].label}
              </span>
              <motion.span 
                key={secondsLeft}
                className="text-5xl sm:text-6xl md:text-7xl font-mono font-light tracking-tight tabular-nums text-[#F4F1EA] gold-text-glow"
              >
                {formatTimer(secondsLeft)}
              </motion.span>

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
      </div>

      {/* Right Column: Cadence Selector */}
      <div className="lg:col-span-5 w-full">
        <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#C8A45D]/15">
            <div className="flex items-center space-x-2">
              <span className="text-[#C8A45D] text-xs">◆</span>
              <h3 className="font-editorial text-xl text-[#F4F1EA] tracking-wide">
                Focus Cadence
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#E5C687]">
              {sessions} COMPLETED
            </span>
          </div>

          <div className="space-y-3">
            {(Object.keys(MODES) as PomodoroMode[]).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer",
                    active
                      ? "bg-[#C8A45D]/15 border-[#C8A45D] text-[#F4F1EA] accent-glow"
                      : "bg-[#12100E]/70 border-[#C8A45D]/15 text-[#9E9587] hover:border-[#C8A45D]/40 hover:text-[#F4F1EA]"
                  )}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[#C8A45D] text-xs">{active ? '◆' : '◇'}</span>
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E5C687]">
                        {MODES[m].label}
                      </span>
                    </div>
                    <p className="text-xs text-[#9E9587] mt-1 pl-4">
                      {MODES[m].subtitle}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-[#F4F1EA]">
                    {Math.floor(MODES[m].seconds / 60)}:00
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
