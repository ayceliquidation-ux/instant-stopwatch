import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flag, RotateCcw } from 'lucide-react';
import { formatTime, cn } from '../utils';
import { Lap } from '../types';

export default function Stopwatch() {
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

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem('stopwatch_time', String(time));
  }, [time]);

  useEffect(() => {
    localStorage.setItem('stopwatch_laps', JSON.stringify(laps));
  }, [laps]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - time;
      timerRef.current = window.setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStartPause = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    localStorage.removeItem('stopwatch_time');
    localStorage.removeItem('stopwatch_laps');
  }, []);

  const handleLap = useCallback(() => {
    if (!isRunning && time === 0) return;
    setLaps((prevLaps) => {
      const lastLapTime = prevLaps.length > 0 ? prevLaps[0].overallTime : 0;
      const newLap: Lap = {
        id: Math.random().toString(36).substring(2, 9),
        time: time - lastLapTime,
        overallTime: time,
      };
      return [newLap, ...prevLaps];
    });
  }, [isRunning, time]);

  // Keyboard shortcuts: Space (Start/Pause), L (Lap), R (Reset)
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

  const currentLapTime = laps.length > 0 ? time - laps[0].overallTime : time;

  // Find fastest & slowest lap when 2+ laps exist
  const lapTimes = laps.map((l) => l.time);
  const fastestLap = lapTimes.length > 1 ? Math.min(...lapTimes) : null;
  const slowestLap = lapTimes.length > 1 ? Math.max(...lapTimes) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
      {/* Left/Center Chronograph Dial & Primary Controls */}
      <div className="lg:col-span-7 flex flex-col items-center lg:items-start space-y-10">
        {/* Chronograph Dial */}
        <div className="relative flex items-center justify-center p-4">
          {/* Ambient Champagne Gold Aura */}
          <div className="absolute inset-0 rounded-full bg-[#C8A45D]/[0.06] blur-[70px] pointer-events-none" />

          <div className="relative w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 rounded-full glass neo-shadow flex flex-col items-center justify-center overflow-hidden">
            {/* Subtle Astrolabe Watermark inside Dial */}
            <div 
              className="absolute inset-0 bg-center bg-cover opacity-[0.12] mix-blend-screen pointer-events-none animate-spin-slow"
              style={{ backgroundImage: `url('/emblem.jpg')` }}
            />

            {/* Ultra-thin Champagne Gold SVG Progress Rings */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Outer Track */}
              <circle
                cx="50"
                cy="50"
                r="47.5"
                fill="none"
                stroke="rgba(200, 164, 93, 0.14)"
                strokeWidth="0.4"
              />
              {/* Tick Marks Ring */}
              <circle
                cx="50"
                cy="50"
                r="45.5"
                fill="none"
                stroke="rgba(200, 164, 93, 0.22)"
                strokeWidth="0.6"
                strokeDasharray="0.5 4.26"
              />
              {/* Active Lap Progress Ring */}
              <motion.circle
                cx="50"
                cy="50"
                r="47.5"
                fill="none"
                stroke="#C8A45D"
                strokeWidth="0.9"
                strokeLinecap="round"
                strokeDasharray="298.45"
                animate={{
                  strokeDashoffset: 298.45 - (298.45 * (currentLapTime % 60000)) / 60000,
                }}
                transition={{ duration: 0.08, ease: "linear" }}
              />
            </svg>

            {/* Time Readout */}
            <div className="relative z-10 flex flex-col items-center px-6 text-center">
              <span className="text-[9px] uppercase tracking-[0.4em] text-[#8A7348] font-semibold mb-3">
                CHRONOGRAPH CAL. 2026
              </span>
              <motion.span
                key={isRunning ? 'running' : 'paused'}
                className="text-5xl sm:text-6xl md:text-7xl font-mono font-light tracking-tight tabular-nums text-[#F4F1EA] gold-text-glow"
              >
                {formatTime(time)}
              </motion.span>

              <div className="mt-5 pt-4 border-t border-[#C8A45D]/15 flex items-center space-x-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#9E9587]">
                  SPLIT
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

        {/* Keyboard Shortcut Legend */}
        <div className="flex items-center space-x-6 text-[10px] uppercase tracking-[0.22em] text-[#8A7348]">
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
        </div>
      </div>

      {/* Right Column: Split Registry / Laps Card */}
      <div className="lg:col-span-5 w-full">
        <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#C8A45D]/15">
            <div className="flex items-center space-x-2">
              <span className="text-[#C8A45D] text-xs">◆</span>
              <h3 className="font-editorial text-xl text-[#F4F1EA] tracking-wide">
                Split Registry
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8A7348]">
              {laps.length} {laps.length === 1 ? 'RECORD' : 'RECORDS'}
            </span>
          </div>

          <div className="grid grid-cols-3 px-4 text-[10px] font-semibold text-[#8A7348] uppercase tracking-[0.25em] pb-3 border-b border-[#C8A45D]/10">
            <span>No.</span>
            <span>Lap Split</span>
            <span className="text-right">Cumulative</span>
          </div>

          <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-[#C8A45D]/10 mt-1 pr-1">
            <AnimatePresence initial={false}>
              {laps.map((lap, index) => {
                const isFastest = fastestLap !== null && lap.time === fastestLap;
                const isSlowest = slowestLap !== null && lap.time === slowestLap;
                return (
                  <motion.div
                    key={lap.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="grid grid-cols-3 items-center py-3.5 px-4 hover:bg-[#C8A45D]/[0.05] transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-[#8A7348]">
                        #{(laps.length - index).toString().padStart(2, '0')}
                      </span>
                      {isFastest && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C8A45D]/20 text-[#E5C687] border border-[#C8A45D]/40">
                          BEST
                        </span>
                      )}
                      {isSlowest && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-950/50 text-red-300 border border-red-500/30">
                          SLOW
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-mono font-medium text-[#F4F1EA] tabular-nums">
                      {formatTime(lap.time)}
                    </span>
                    <span className="text-sm font-mono text-[#9E9587] text-right tabular-nums">
                      {formatTime(lap.overallTime)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {laps.length === 0 && (
              <div className="py-14 text-center flex flex-col items-center justify-center space-y-2">
                <Flag size={20} className="text-[#8A7348]/50" />
                <p className="font-editorial italic text-base text-[#9E9587]">
                  No horological splits recorded yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
