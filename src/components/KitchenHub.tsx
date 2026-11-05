import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Egg, Flame, Utensils, Coffee, Play, Pause, RotateCcw, Trash2, Thermometer, Plus } from 'lucide-react';
import { formatTimer, cn } from '../utils';
import { soundEngine } from '../utils/soundEngine';

type CulinaryCategory = 'eggs' | 'steak' | 'pasta' | 'tea';

interface ActiveKitchenTimer {
  id: string;
  title: string;
  subtitle: string;
  totalSeconds: number;
  secondsLeft: number;
  isRunning: boolean;
  endTimestamp?: number | null;
  restSeconds?: number;
  inRestPhase?: boolean;
}

const EGG_PRESETS = [
  { id: 'soft', label: 'Soft & Runny', subtitle: 'Silky liquid yolk, tender set white (6m 00s)', seconds: 360, temp: '100°C Boiling' },
  { id: 'jammy', label: 'Jammy Ramen', subtitle: 'Custard-like golden center (7m 30s)', seconds: 450, temp: '100°C Simmer' },
  { id: 'hard', label: 'Classic Hard', subtitle: 'Fully set creamy golden yolk (10m 00s)', seconds: 600, temp: '100°C Simmer' },
];

const STEAK_THICKNESS = [
  { label: '2.5 cm (1")', multiplier: 1 },
  { label: '3.8 cm (1.5")', multiplier: 1.45 },
  { label: '5.0 cm (2")', multiplier: 1.9 },
];

const STEAK_DONENESS = [
  { id: 'rare', label: 'Bleu / Rare', coreTemp: '50°C / 122°F', baseSeconds: 210, restSeconds: 300 },
  { id: 'medium-rare', label: 'Medium Rare', coreTemp: '55°C / 131°F', baseSeconds: 270, restSeconds: 360 },
  { id: 'medium', label: 'Medium', coreTemp: '60°C / 140°F', baseSeconds: 330, restSeconds: 360 },
  { id: 'well', label: 'Medium Well', coreTemp: '66°C / 150°F', baseSeconds: 420, restSeconds: 420 },
];

const PASTA_PRESETS = [
  { id: 'capellini', label: 'Capellini / Angel Hair', subtitle: 'Delicate fine strands — Al Dente', seconds: 180 },
  { id: 'spaghetti', label: 'Artisanal Spaghetti', subtitle: 'Bronze-die extruded — Al Dente', seconds: 540 },
  { id: 'rigatoni', label: 'Mezzi Rigatoni', subtitle: 'Structured ridged tubes — Al Dente', seconds: 660 },
  { id: 'tagliatelle', label: 'Fresh Egg Tagliatelle', subtitle: 'Hand-rolled pasta — Tender bite', seconds: 210 },
];

const TEA_PRESETS = [
  { id: 'white', label: 'Silver Needle White', temp: '75°C / 167°F', subtitle: 'Delicate floral honey notes', seconds: 180 },
  { id: 'green', label: 'Gyokuro / Sencha Green', temp: '80°C / 176°F', subtitle: 'Vibrant umami infusion', seconds: 120 },
  { id: 'oolong', label: 'High Mountain Oolong', temp: '90°C / 194°F', subtitle: 'Roasted orchid complexity', seconds: 210 },
  { id: 'black', label: 'Darjeeling First Flush', temp: '96°C / 205°F', subtitle: 'Brisk muscatel character', seconds: 240 },
  { id: 'herbal', label: 'Chamomile & Verbena', temp: '100°C / 212°F', subtitle: 'Full botanical tisane extraction', seconds: 330 },
];

interface KitchenHubProps {
  onTitleUpdate?: (title: string | null) => void;
}

export default function KitchenHub({ onTitleUpdate }: KitchenHubProps) {
  const [category, setCategory] = useState<CulinaryCategory>('eggs');
  const [thicknessIdx, setThicknessIdx] = useState(0);
  const [donenessIdx, setDonenessIdx] = useState(1);

  const [timers, setTimers] = useState<ActiveKitchenTimer[]>(() => {
    try {
      const saved = localStorage.getItem('kitchen_active_timers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'default-jammy',
        title: 'Jammy Ramen Egg',
        subtitle: '100°C Simmer · Custard Center',
        totalSeconds: 450,
        secondsLeft: 450,
        isRunning: false,
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('kitchen_active_timers', JSON.stringify(timers));
  }, [timers]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.isRunning) return t;
          const now = Date.now();
          const target = t.endTimestamp || now + t.secondsLeft * 1000;
          const remSec = Math.ceil((target - now) / 1000);

          if (remSec > 0) {
            return { ...t, secondsLeft: remSec, endTimestamp: target };
          }

          soundEngine.playAlarm();
          soundEngine.notify('Culinary Timer Complete', `${t.title} is ready!`);

          if (t.restSeconds && !t.inRestPhase) {
            return {
              ...t,
              inRestPhase: true,
              totalSeconds: t.restSeconds,
              secondsLeft: t.restSeconds,
              endTimestamp: Date.now() + t.restSeconds * 1000,
              subtitle: 'Resting Phase — Tent loosely with foil',
              isRunning: true,
            };
          }
          return { ...t, secondsLeft: 0, isRunning: false, endTimestamp: null };
        })
      );
    }, 250);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const runningTimers = timers.filter((t) => t.isRunning);
    if (runningTimers.length > 0) {
      const urgent = runningTimers.reduce((a, b) => (a.secondsLeft <= b.secondsLeft ? a : b));
      onTitleUpdate?.(`[${formatTimer(urgent.secondsLeft)}] ${urgent.title} — Stopwatch+`);
    } else {
      onTitleUpdate?.(null);
    }
  }, [timers, onTitleUpdate]);

  const addKitchenTimer = (title: string, subtitle: string, seconds: number, restSeconds?: number) => {
    soundEngine.playClick();
    const newTimer: ActiveKitchenTimer = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      subtitle,
      totalSeconds: seconds,
      secondsLeft: seconds,
      endTimestamp: Date.now() + seconds * 1000,
      isRunning: true,
      restSeconds,
      inRestPhase: false,
    };
    setTimers((prev) => [newTimer, ...prev]);
  };

  const toggleTimer = (id: string) => {
    soundEngine.playClick();
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.secondsLeft <= 0) return t;
        const nextRun = !t.isRunning;
        return {
          ...t,
          isRunning: nextRun,
          endTimestamp: nextRun ? Date.now() + t.secondsLeft * 1000 : null,
        };
      })
    );
  };

  const resetTimer = (id: string) => {
    soundEngine.playClick();
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, isRunning: false, secondsLeft: t.totalSeconds, endTimestamp: null, inRestPhase: false }
          : t
      )
    );
  };

  const removeTimer = (id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const categories = [
    { id: 'eggs' as const, label: 'EGGS', icon: Egg },
    { id: 'steak' as const, label: 'STEAK & REST', icon: Flame },
    { id: 'pasta' as const, label: 'PASTA', icon: Utensils },
    { id: 'tea' as const, label: 'TEA INFUSION', icon: Coffee },
  ];

  const selectedSteakDoneness = STEAK_DONENESS[donenessIdx];
  const selectedSteakThickness = STEAK_THICKNESS[thicknessIdx];
  const calculatedSteakSeconds = Math.round(
    selectedSteakDoneness.baseSeconds * selectedSteakThickness.multiplier
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full">
      {/* Left Column: Culinary Selector & Presets */}
      <div className="lg:col-span-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl glass border border-[#C8A45D]/20">
          {categories.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "py-3 px-3 rounded-xl text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center justify-center space-x-2 transition-all cursor-pointer",
                  active
                    ? "bg-[#C8A45D] text-[#0A0908] shadow-md"
                    : "text-[#9E9587] hover:text-[#F4F1EA]"
                )}
              >
                <cat.icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20">
          {category === 'eggs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
                <h3 className="font-editorial text-2xl text-[#F4F1EA]">Precision Egg Chronometry</h3>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#C8A45D]">LARGE GRADE A</span>
              </div>
              <div className="space-y-3">
                {EGG_PRESETS.map((egg) => (
                  <div
                    key={egg.id}
                    className="p-4 rounded-xl bg-[#12100E]/80 border border-[#C8A45D]/15 hover:border-[#C8A45D]/40 transition-all flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[#C8A45D] text-xs">◆</span>
                        <span className="text-sm font-semibold text-[#F4F1EA]">{egg.label}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C8A45D]/15 text-[#E5C687]">
                          {egg.temp}
                        </span>
                      </div>
                      <p className="text-xs text-[#9E9587] mt-1 pl-4">{egg.subtitle}</p>
                    </div>
                    <button
                      onClick={() => addKitchenTimer(`${egg.label} Egg`, egg.temp, egg.seconds)}
                      className="btn-chamfer px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E5C687] flex items-center space-x-1.5 shrink-0 cursor-pointer"
                    >
                      <Plus size={13} className="text-[#C8A45D]" />
                      <span>{formatTimer(egg.seconds)}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {category === 'steak' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
                <h3 className="font-editorial text-2xl text-[#F4F1EA]">Searing & Resting Cadence</h3>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#C8A45D]">AUTO-REST PHASE</span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.25em] text-[#8A7348] font-semibold">
                  1. Cut Thickness
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {STEAK_THICKNESS.map((th, idx) => (
                    <button
                      key={th.label}
                      onClick={() => setThicknessIdx(idx)}
                      className={cn(
                        "py-3 px-2 rounded-xl text-xs font-mono border transition-all cursor-pointer",
                        thicknessIdx === idx
                          ? "bg-[#C8A45D]/20 border-[#C8A45D] text-[#E5C687]"
                          : "bg-[#12100E]/70 border-[#C8A45D]/15 text-[#9E9587] hover:text-[#F4F1EA]"
                      )}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.25em] text-[#8A7348] font-semibold">
                  2. Target Doneness & Core Temp
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {STEAK_DONENESS.map((d, idx) => (
                    <button
                      key={d.id}
                      onClick={() => setDonenessIdx(idx)}
                      className={cn(
                        "p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                        donenessIdx === idx
                          ? "bg-[#C8A45D]/20 border-[#C8A45D] text-[#F4F1EA]"
                          : "bg-[#12100E]/70 border-[#C8A45D]/15 text-[#9E9587] hover:text-[#F4F1EA]"
                      )}
                    >
                      <div className="text-xs font-semibold text-[#E5C687]">{d.label}</div>
                      <div className="text-[11px] font-mono text-[#9E9587] mt-0.5">{d.coreTemp}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0908]/90 border border-[#C8A45D]/25 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E5C687]">
                    Sear {formatTimer(calculatedSteakSeconds)} + Rest {formatTimer(selectedSteakDoneness.restSeconds)}
                  </div>
                  <p className="text-[11px] text-[#9E9587] mt-1">
                    Flip halfway at {formatTimer(Math.round(calculatedSteakSeconds / 2))} · Automatic resting timer follows
                  </p>
                </div>
                <button
                  onClick={() =>
                    addKitchenTimer(
                      `Steak (${selectedSteakDoneness.label})`,
                      `${selectedSteakThickness.label} · ${selectedSteakDoneness.coreTemp} (Flip halfway)`,
                      calculatedSteakSeconds,
                      selectedSteakDoneness.restSeconds
                    )
                  }
                  className="btn-chamfer px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#F4F1EA] flex items-center space-x-2 shrink-0 cursor-pointer"
                >
                  <span className="text-[#C8A45D]">◇</span>
                  <span>START SEAR</span>
                </button>
              </div>
            </div>
          )}

          {category === 'pasta' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
                <h3 className="font-editorial text-2xl text-[#F4F1EA]">Artisanal Pasta Al Dente</h3>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#C8A45D]">SALTED ROLLING BOIL</span>
              </div>
              <div className="space-y-3">
                {PASTA_PRESETS.map((pasta) => (
                  <div
                    key={pasta.id}
                    className="p-4 rounded-xl bg-[#12100E]/80 border border-[#C8A45D]/15 hover:border-[#C8A45D]/40 transition-all flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[#C8A45D] text-xs">◆</span>
                        <span className="text-sm font-semibold text-[#F4F1EA]">{pasta.label}</span>
                      </div>
                      <p className="text-xs text-[#9E9587] mt-1 pl-4">{pasta.subtitle}</p>
                    </div>
                    <button
                      onClick={() => addKitchenTimer(pasta.label, pasta.subtitle, pasta.seconds)}
                      className="btn-chamfer px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E5C687] flex items-center space-x-1.5 shrink-0 cursor-pointer"
                    >
                      <Plus size={13} className="text-[#C8A45D]" />
                      <span>{formatTimer(pasta.seconds)}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {category === 'tea' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
                <h3 className="font-editorial text-2xl text-[#F4F1EA]">Botanical & Leaf Steep</h3>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#C8A45D]">TEMPERATURE CALIBRATED</span>
              </div>
              <div className="space-y-3">
                {TEA_PRESETS.map((tea) => (
                  <div
                    key={tea.id}
                    className="p-4 rounded-xl bg-[#12100E]/80 border border-[#C8A45D]/15 hover:border-[#C8A45D]/40 transition-all flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-[#C8A45D] text-xs">◆</span>
                        <span className="text-sm font-semibold text-[#F4F1EA]">{tea.label}</span>
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#C8A45D]/15 text-[#E5C687]">
                          <Thermometer size={11} />
                          <span>{tea.temp}</span>
                        </span>
                      </div>
                      <p className="text-xs text-[#9E9587] mt-1 pl-4">{tea.subtitle}</p>
                    </div>
                    <button
                      onClick={() => addKitchenTimer(tea.label, `Steep at ${tea.temp}`, tea.seconds)}
                      className="btn-chamfer px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E5C687] flex items-center space-x-1.5 shrink-0 cursor-pointer"
                    >
                      <Plus size={13} className="text-[#C8A45D]" />
                      <span>{formatTimer(tea.seconds)}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Active Multi-Channel Kitchen Timers */}
      <div className="lg:col-span-6 w-full">
        <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#C8A45D]/15">
            <div className="flex items-center space-x-2">
              <span className="text-[#C8A45D] text-xs">◆</span>
              <h3 className="font-editorial text-2xl text-[#F4F1EA] tracking-wide">
                Active Culinary Channels
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#E5C687]">
              {timers.filter((t) => t.isRunning).length} RUNNING / {timers.length} TOTAL
            </span>
          </div>

          <div className="space-y-4 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
            <AnimatePresence initial={false}>
              {timers.map((t) => {
                const progress =
                  t.totalSeconds > 0
                    ? ((t.totalSeconds - t.secondsLeft) / t.totalSeconds) * 100
                    : 100;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 rounded-2xl bg-[#12100E]/90 border border-[#C8A45D]/25 flex items-center justify-between gap-4"
                  >
                    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="rgba(200, 164, 93, 0.15)"
                          strokeWidth="3"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#C8A45D"
                          strokeWidth="3.5"
                          strokeDasharray="282.74"
                          strokeDashoffset={282.74 - (282.74 * progress) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-[11px] font-mono font-semibold text-[#E5C687]">
                        {Math.round(100 - progress)}%
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-[#F4F1EA] truncate">{t.title}</h4>
                        {t.inRestPhase && (
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#C8A45D]/25 text-[#E5C687] border border-[#C8A45D]/50">
                            RESTING
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9E9587] truncate mt-0.5">{t.subtitle}</p>
                      <div className="text-2xl font-mono font-light text-[#F4F1EA] mt-1 tabular-nums">
                        {formatTimer(t.secondsLeft)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => toggleTimer(t.id)}
                        className="p-3 rounded-xl bg-[#C8A45D]/15 border border-[#C8A45D]/40 text-[#E5C687] hover:bg-[#C8A45D] hover:text-[#0A0908] transition-all cursor-pointer"
                        title={t.isRunning ? 'Pause' : 'Start'}
                      >
                        {t.isRunning ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => resetTimer(t.id)}
                        className="p-3 rounded-xl glass text-[#9E9587] hover:text-[#F4F1EA] transition-all cursor-pointer"
                        title="Reset"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => removeTimer(t.id)}
                        className="p-3 rounded-xl glass text-[#8A7348] hover:text-red-400 transition-all cursor-pointer"
                        title="Dismiss"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {timers.length === 0 && (
              <div className="py-16 text-center space-y-2">
                <p className="font-editorial italic text-lg text-[#9E9587]">
                  No culinary channels active. Select an egg, steak, pasta, or tea preset on the left.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
