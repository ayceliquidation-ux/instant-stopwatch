import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Egg,
  Flame,
  Utensils,
  Coffee,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Thermometer,
  Plus,
  Scale,
  AlertTriangle,
} from 'lucide-react';
import { formatTimer, cn } from '../utils';
import { soundEngine } from '../utils/soundEngine';

type CulinaryCategory = 'eggs' | 'steak' | 'pasta' | 'barista';

interface StagePrompt {
  atSecondsRemaining: number;
  message: string;
  triggered?: boolean;
}

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
  stagePrompts?: StagePrompt[];
  activeBanner?: string | null;
}

const EGG_STYLES = [
  { id: 'soft', label: 'Soft & Runny', desc: 'Silky liquid yolk, tender set white', baseSec: 360, temp: '100°C Rolling Boil' },
  { id: 'jammy', label: 'Jammy Ramen', desc: 'Custard-like golden center', baseSec: 440, temp: '100°C Simmer' },
  { id: 'medium', label: 'Medium Firm', desc: 'Creamy semi-firm center', baseSec: 510, temp: '100°C Simmer' },
  { id: 'hard', label: 'Classic Hard Boiled', desc: 'Fully set golden yolk, zero grey ring', baseSec: 600, temp: '100°C Simmer' },
  { id: 'poached', label: 'Vortex Poached', desc: 'Delicate mantle, liquid gold core', baseSec: 195, temp: '88°C Bare Simmer' },
];

const EGG_SIZES = [
  { id: 'medium', label: 'Medium (50g)', offsetSec: -30 },
  { id: 'large', label: 'Large (60g)', offsetSec: 0 },
  { id: 'jumbo', label: 'Jumbo (70g+)', offsetSec: 40 },
];

const EGG_TEMPS = [
  { id: 'fridge', label: 'Fridge Cold (4°C)', offsetSec: 0 },
  { id: 'room', label: 'Room Temp (20°C)', offsetSec: -35 },
];

const STEAK_CUTS = ['Ribeye', 'New York Strip', 'Filet Mignon', 'Sirloin'];

const STEAK_THICKNESS = [
  { label: '0.75" (1.9 cm)', multiplier: 0.78 },
  { label: '1.0" (2.5 cm)', multiplier: 1.0 },
  { label: '1.5" (3.8 cm)', multiplier: 1.45 },
  { label: '2.0" (5.0 cm)', multiplier: 1.9 },
];

const STEAK_METHODS = [
  { id: 'cast-iron', label: 'Cast Iron Skillet', factor: 1.0 },
  { id: 'grill', label: 'Open Flame Grill', factor: 1.08 },
  { id: 'air-fryer', label: 'Air Fryer (200°C)', factor: 1.35 },
];

const STEAK_DONENESS = [
  { id: 'rare', label: 'Bleu / Rare', coreTemp: '50°C / 122°F', baseSeconds: 210, restSeconds: 300 },
  { id: 'medium-rare', label: 'Medium Rare', coreTemp: '55°C / 131°F', baseSeconds: 270, restSeconds: 300 },
  { id: 'medium', label: 'Medium', coreTemp: '60°C / 140°F', baseSeconds: 330, restSeconds: 300 },
  { id: 'medium-well', label: 'Medium Well', coreTemp: '65°C / 149°F', baseSeconds: 390, restSeconds: 300 },
  { id: 'well', label: 'Well Done', coreTemp: '70°C / 158°F', baseSeconds: 450, restSeconds: 300 },
];

const PASTA_PRESETS = [
  { id: 'capellini', label: 'Capellini / Angel Hair', subtitle: 'Delicate fine strands — Al Dente', seconds: 180 },
  { id: 'spaghetti', label: 'Artisanal Spaghetti', subtitle: 'Bronze-die extruded — Al Dente', seconds: 540 },
  { id: 'rigatoni', label: 'Mezzi Rigatoni', subtitle: 'Structured ridged tubes — Al Dente', seconds: 660 },
  { id: 'tagliatelle', label: 'Fresh Egg Tagliatelle', subtitle: 'Hand-rolled pasta — Tender bite', seconds: 210 },
];

const BARISTA_PRESETS = [
  {
    id: 'pourover',
    label: 'V60 / Chemex Pour-Over',
    temp: '93°C / 200°F',
    subtitle: '45s Bloom → Stage 1 Spiral Pour → Final Drawdown',
    seconds: 180,
    stages: [
      { atSecondsRemaining: 135, message: 'BLOOM COMPLETE (0:45) — BEGIN STAGE 1 SPIRAL POUR (TO 180g)!' },
      { atSecondsRemaining: 75, message: 'STAGE 2 FINAL POUR (TO 300g) & GENTLE SWIRL FOR DRAWDOWN!' },
    ],
  },
  {
    id: 'frenchpress',
    label: 'Artisanal French Press',
    temp: '95°C / 203°F',
    subtitle: '4m Immersion Steep → Crust Break & Slow Plunge Alert',
    seconds: 240,
    stages: [
      { atSecondsRemaining: 180, message: '1 MINUTE IN — GENTLY STIR TOP CRUST WITH WOODEN PADDLE!' },
      { atSecondsRemaining: 15, message: 'PREPARE TO PRESS — PLUNGE SLOWLY AT 00:00!' },
    ],
  },
  {
    id: 'green',
    label: 'Gyokuro / Sencha Green Tea',
    temp: '80°C / 176°F',
    subtitle: 'Vibrant umami leaf infusion',
    seconds: 120,
  },
  {
    id: 'oolong',
    label: 'High Mountain Oolong Tea',
    temp: '90°C / 194°F',
    subtitle: 'Roasted orchid complexity',
    seconds: 210,
  },
  {
    id: 'black',
    label: 'Darjeeling First Flush Black',
    temp: '96°C / 205°F',
    subtitle: 'Brisk muscatel character',
    seconds: 240,
  },
  {
    id: 'herbal',
    label: 'Chamomile & Botanical Tisane',
    temp: '100°C / 212°F',
    subtitle: 'Full herbal blossom extraction',
    seconds: 330,
  },
];

interface KitchenHubProps {
  onTitleUpdate?: (title: string | null) => void;
}

export default function KitchenHub({ onTitleUpdate }: KitchenHubProps) {
  const [category, setCategory] = useState<CulinaryCategory>('steak');

  // Egg Lab Config
  const [eggSizeIdx, setEggSizeIdx] = useState(1); // Large
  const [eggTempIdx, setEggTempIdx] = useState(0); // Fridge

  // Steak Config
  const [steakCut, setSteakCut] = useState('Ribeye');
  const [thicknessIdx, setThicknessIdx] = useState(1); // 1.0"
  const [methodIdx, setMethodIdx] = useState(0); // Cast Iron
  const [donenessIdx, setDonenessIdx] = useState(1); // Medium Rare

  // Culinary Unit & Oven Converter
  const [showConverter, setShowConverter] = useState(false);
  const [grams, setGrams] = useState('100');
  const [cups, setCups] = useState('1');
  const [tbsp, setTbsp] = useState('2');
  const [fahrenheit, setFahrenheit] = useState('400');

  const [timers, setTimers] = useState<ActiveKitchenTimer[]>(() => {
    try {
      const saved = localStorage.getItem('kitchen_active_timers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'default-jammy',
        title: 'Jammy Ramen Egg (Large)',
        subtitle: '100°C Simmer · Fridge Start',
        totalSeconds: 440,
        secondsLeft: 440,
        isRunning: false,
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('kitchen_active_timers', JSON.stringify(timers));
  }, [timers]);

  // Multi-Stage Mid-Cook Prompt & Countdown Engine
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.isRunning) return t;
          const now = Date.now();
          const target = t.endTimestamp || now + t.secondsLeft * 1000;
          const remSec = Math.ceil((target - now) / 1000);

          if (remSec > 0) {
            let nextBanner = t.activeBanner;
            let updatedPrompts = t.stagePrompts;

            if (t.stagePrompts && t.stagePrompts.length > 0) {
              updatedPrompts = t.stagePrompts.map((sp) => {
                if (!sp.triggered && remSec <= sp.atSecondsRemaining) {
                  soundEngine.playCountdownPip(true);
                  soundEngine.notify(`Culinary Stage Alert — ${t.title}`, sp.message);
                  nextBanner = sp.message;
                  return { ...sp, triggered: true };
                }
                return sp;
              });
            }

            return {
              ...t,
              secondsLeft: remSec,
              endTimestamp: target,
              stagePrompts: updatedPrompts,
              activeBanner: nextBanner,
            };
          }

          // Timer Reached 00:00
          soundEngine.playAlarm();
          soundEngine.notify('Culinary Timer Complete', `${t.title} phase complete!`);

          if (t.restSeconds && !t.inRestPhase) {
            return {
              ...t,
              inRestPhase: true,
              totalSeconds: t.restSeconds,
              secondsLeft: t.restSeconds,
              endTimestamp: Date.now() + t.restSeconds * 1000,
              subtitle: '5-Minute Resting Phase — Tent loosely on warm board',
              activeBanner: 'SEAR COMPLETE — REST STEAK FOR 5 MINUTES BEFORE SLICING!',
              isRunning: true,
            };
          }
          return {
            ...t,
            secondsLeft: 0,
            isRunning: false,
            endTimestamp: null,
            activeBanner: 'COMPLETE — READY TO SERVE!',
          };
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

  const addKitchenTimer = (
    title: string,
    subtitle: string,
    seconds: number,
    restSeconds?: number,
    stagePrompts?: StagePrompt[]
  ) => {
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
      stagePrompts: stagePrompts ? stagePrompts.map((s) => ({ ...s, triggered: false })) : [],
      activeBanner: null,
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
          ? {
              ...t,
              isRunning: false,
              secondsLeft: t.totalSeconds,
              endTimestamp: null,
              inRestPhase: false,
              activeBanner: null,
              stagePrompts: t.stagePrompts?.map((s) => ({ ...s, triggered: false })),
            }
          : t
      )
    );
  };

  const removeTimer = (id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const categories = [
    { id: 'steak' as const, label: 'STEAK CALCULATOR', icon: Flame },
    { id: 'eggs' as const, label: 'EGG PRECISION LAB', icon: Egg },
    { id: 'barista' as const, label: 'BARISTA & TEA', icon: Coffee },
    { id: 'pasta' as const, label: 'ARTISAN PASTA', icon: Utensils },
  ];

  const selectedSteakDoneness = STEAK_DONENESS[donenessIdx];
  const selectedSteakThickness = STEAK_THICKNESS[thicknessIdx];
  const selectedSteakMethod = STEAK_METHODS[methodIdx];
  const calculatedSteakSeconds = Math.round(
    selectedSteakDoneness.baseSeconds *
      selectedSteakThickness.multiplier *
      selectedSteakMethod.factor
  );
  const halfSteakSeconds = Math.round(calculatedSteakSeconds / 2);

  return (
    <div className="space-y-8 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full">
        {/* Left Column: Multi-Stage Culinary Configurator */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl glass border border-[#C8A45D]/20">
            {categories.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "py-3 px-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-[0.16em] flex items-center justify-center space-x-1.5 transition-all cursor-pointer",
                    active
                      ? "bg-[#C8A45D] text-[#0A0908] shadow-md"
                      : "text-[#9E9587] hover:text-[#F4F1EA]"
                  )}
                >
                  <cat.icon size={13} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="glass rounded-2xl p-6 neo-shadow border border-[#C8A45D]/20">
            {category === 'steak' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
                  <h3 className="font-editorial text-2xl text-[#F4F1EA]">Steak Sear & Rest Calculator</h3>
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C8A45D]">
                    50% FLIP ALERT + 5M REST
                  </span>
                </div>

                {/* Cut + Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A7348] font-semibold block mb-1.5">
                      1. Prime Cut
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {STEAK_CUTS.map((cut) => (
                        <button
                          key={cut}
                          onClick={() => setSteakCut(cut)}
                          className={cn(
                            "py-2 px-2.5 rounded-lg text-[11px] border transition-all cursor-pointer",
                            steakCut === cut
                              ? "bg-[#C8A45D]/25 border-[#C8A45D] text-[#E5C687]"
                              : "bg-[#12100E] border-[#C8A45D]/15 text-[#9E9587]"
                          )}
                        >
                          {cut}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A7348] font-semibold block mb-1.5">
                      2. Heat Method
                    </label>
                    <div className="space-y-1.5">
                      {STEAK_METHODS.map((m, idx) => (
                        <button
                          key={m.id}
                          onClick={() => setMethodIdx(idx)}
                          className={cn(
                            "w-full py-1.5 px-3 rounded-lg text-[11px] border text-left transition-all cursor-pointer",
                            methodIdx === idx
                              ? "bg-[#C8A45D]/25 border-[#C8A45D] text-[#E5C687]"
                              : "bg-[#12100E] border-[#C8A45D]/15 text-[#9E9587]"
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Thickness */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A7348] font-semibold block">
                    3. Cut Thickness
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STEAK_THICKNESS.map((th, idx) => (
                      <button
                        key={th.label}
                        onClick={() => setThicknessIdx(idx)}
                        className={cn(
                          "py-2.5 px-2 rounded-xl text-[11px] font-mono border transition-all cursor-pointer",
                          thicknessIdx === idx
                            ? "bg-[#C8A45D]/20 border-[#C8A45D] text-[#E5C687]"
                            : "bg-[#12100E]/70 border-[#C8A45D]/15 text-[#9E9587]"
                        )}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Doneness */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A7348] font-semibold block">
                    4. Target Doneness & Core Temp
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STEAK_DONENESS.map((d, idx) => (
                      <button
                        key={d.id}
                        onClick={() => setDonenessIdx(idx)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                          donenessIdx === idx
                            ? "bg-[#C8A45D]/20 border-[#C8A45D] text-[#F4F1EA]"
                            : "bg-[#12100E]/70 border-[#C8A45D]/15 text-[#9E9587]"
                        )}
                      >
                        <div className="text-xs font-semibold text-[#E5C687]">{d.label}</div>
                        <div className="text-[10px] font-mono text-[#9E9587]">{d.coreTemp}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0908]/90 border border-[#C8A45D]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E5C687]">
                      Sear {formatTimer(calculatedSteakSeconds)} · Flip Alert at {formatTimer(halfSteakSeconds)} · Rest 05:00
                    </div>
                    <p className="text-[11px] text-[#9E9587] mt-1">
                      {steakCut} ({selectedSteakThickness.label}) via {selectedSteakMethod.label}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      addKitchenTimer(
                        `${steakCut} (${selectedSteakDoneness.label})`,
                        `${selectedSteakThickness.label} · ${selectedSteakMethod.label} · ${selectedSteakDoneness.coreTemp}`,
                        calculatedSteakSeconds,
                        selectedSteakDoneness.restSeconds,
                        [
                          {
                            atSecondsRemaining: halfSteakSeconds,
                            message: '50% SEAR REACHED — FLIP STEAK NOW FOR EVEN MAILLARD CRUST!',
                          },
                        ]
                      )
                    }
                    className="btn-chamfer px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#F4F1EA] flex items-center space-x-2 shrink-0 cursor-pointer"
                  >
                    <span className="text-[#C8A45D]">◇</span>
                    <span>LAUNCH STEAK</span>
                  </button>
                </div>
              </div>
            )}

            {category === 'eggs' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
                  <h3 className="font-editorial text-2xl text-[#F4F1EA]">Egg Precision Lab</h3>
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C8A45D]">
                    SIZE & TEMP COMPENSATED
                  </span>
                </div>

                {/* Size & Start Temp Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A7348] block mb-1.5">
                      Egg Weight / Grade
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {EGG_SIZES.map((sz, i) => (
                        <button
                          key={sz.id}
                          onClick={() => setEggSizeIdx(i)}
                          className={cn(
                            "py-2 px-1.5 rounded-lg text-[10px] font-mono border cursor-pointer",
                            eggSizeIdx === i
                              ? "bg-[#C8A45D]/20 border-[#C8A45D] text-[#E5C687]"
                              : "bg-[#12100E] border-[#C8A45D]/15 text-[#9E9587]"
                          )}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A7348] block mb-1.5">
                      Starting Temperature
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {EGG_TEMPS.map((tp, i) => (
                        <button
                          key={tp.id}
                          onClick={() => setEggTempIdx(i)}
                          className={cn(
                            "py-2 px-2 rounded-lg text-[10px] font-mono border cursor-pointer",
                            eggTempIdx === i
                              ? "bg-[#C8A45D]/20 border-[#C8A45D] text-[#E5C687]"
                              : "bg-[#12100E] border-[#C8A45D]/15 text-[#9E9587]"
                          )}
                        >
                          {tp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {EGG_STYLES.map((egg) => {
                    const adjustedSec = Math.max(
                      120,
                      egg.baseSec + EGG_SIZES[eggSizeIdx].offsetSec + EGG_TEMPS[eggTempIdx].offsetSec
                    );
                    return (
                      <div
                        key={egg.id}
                        className="p-3.5 rounded-xl bg-[#12100E]/80 border border-[#C8A45D]/15 hover:border-[#C8A45D]/40 transition-all flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[#C8A45D] text-xs">◆</span>
                            <span className="text-sm font-semibold text-[#F4F1EA]">{egg.label}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C8A45D]/15 text-[#E5C687]">
                              {egg.temp}
                            </span>
                          </div>
                          <p className="text-xs text-[#9E9587] mt-0.5 pl-4">{egg.desc}</p>
                        </div>
                        <button
                          onClick={() =>
                            addKitchenTimer(
                              `${egg.label} Egg (${EGG_SIZES[eggSizeIdx].label.split(' ')[0]})`,
                              `${egg.temp} · ${EGG_TEMPS[eggTempIdx].label} · Ice bath immediately at 00:00`,
                              adjustedSec
                            )
                          }
                          className="btn-chamfer px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E5C687] flex items-center space-x-1.5 shrink-0 cursor-pointer"
                        >
                          <Plus size={13} className="text-[#C8A45D]" />
                          <span>{formatTimer(adjustedSec)}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {category === 'barista' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
                  <h3 className="font-editorial text-2xl text-[#F4F1EA]">Barista Coffee & Tea Suite</h3>
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C8A45D]">
                    BLOOM & POUR PROMPTS
                  </span>
                </div>
                <div className="space-y-2.5">
                  {BARISTA_PRESETS.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-[#12100E]/80 border border-[#C8A45D]/15 hover:border-[#C8A45D]/40 transition-all flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-[#C8A45D] text-xs">◆</span>
                          <span className="text-sm font-semibold text-[#F4F1EA]">{item.label}</span>
                          <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#C8A45D]/15 text-[#E5C687]">
                            <Thermometer size={11} />
                            <span>{item.temp}</span>
                          </span>
                        </div>
                        <p className="text-xs text-[#9E9587] mt-1 pl-4">{item.subtitle}</p>
                      </div>
                      <button
                        onClick={() =>
                          addKitchenTimer(item.label, `${item.temp} · ${item.subtitle}`, item.seconds, undefined, item.stages)
                        }
                        className="btn-chamfer px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E5C687] flex items-center space-x-1.5 shrink-0 cursor-pointer"
                      >
                        <Plus size={13} className="text-[#C8A45D]" />
                        <span>{formatTimer(item.seconds)}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {category === 'pasta' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
                  <h3 className="font-editorial text-2xl text-[#F4F1EA]">Artisanal Pasta Al Dente</h3>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#C8A45D]">
                    SALTED ROLLING BOIL
                  </span>
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
                        onClick={() =>
                          addKitchenTimer(pasta.label, pasta.subtitle, pasta.seconds, undefined, [
                            {
                              atSecondsRemaining: 60,
                              message: '1 MINUTE LEFT — TASTE TEST PASTA FOR AL DENTE & RESERVE STARCH WATER!',
                            },
                          ])
                        }
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
          </div>

          {/* Collapsible Culinary Unit & Oven Converter */}
          <div className="glass rounded-2xl p-5 border border-[#C8A45D]/20">
            <button
              onClick={() => setShowConverter(!showConverter)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Scale size={16} className="text-[#C8A45D]" />
                <span className="font-editorial text-xl text-[#F4F1EA]">
                  Culinary Unit & Oven Temperature Converter
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#E5C687]">
                {showConverter ? 'HIDE ▲' : 'EXPAND ▼'}
              </span>
            </button>

            <AnimatePresence>
              {showConverter && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 mt-4 border-t border-[#C8A45D]/15 overflow-hidden"
                >
                  {/* Grams <-> Ounces */}
                  <div className="p-3.5 rounded-xl bg-[#0A0908]/80 border border-[#C8A45D]/20 space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A7348] block">
                      Mass: Grams ↔ Ounces
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={grams}
                        onChange={(e) => setGrams(e.target.value)}
                        className="w-24 bg-[#12100E] border border-[#C8A45D]/25 rounded-lg p-2 text-xs font-mono text-[#F4F1EA]"
                      />
                      <span className="text-xs font-mono text-[#9E9587]">g =</span>
                      <span className="text-sm font-mono text-[#E5C687] font-semibold">
                        {((Number(grams) || 0) * 0.035274).toFixed(2)} oz
                      </span>
                    </div>
                  </div>

                  {/* Cups <-> mL */}
                  <div className="p-3.5 rounded-xl bg-[#0A0908]/80 border border-[#C8A45D]/20 space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A7348] block">
                      Volume: US Cups ↔ mL
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.25"
                        value={cups}
                        onChange={(e) => setCups(e.target.value)}
                        className="w-24 bg-[#12100E] border border-[#C8A45D]/25 rounded-lg p-2 text-xs font-mono text-[#F4F1EA]"
                      />
                      <span className="text-xs font-mono text-[#9E9587]">cups =</span>
                      <span className="text-sm font-mono text-[#E5C687] font-semibold">
                        {Math.round((Number(cups) || 0) * 236.588)} mL
                      </span>
                    </div>
                  </div>

                  {/* Tbsp <-> Tsp / mL */}
                  <div className="p-3.5 rounded-xl bg-[#0A0908]/80 border border-[#C8A45D]/20 space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A7348] block">
                      Spoons: Tbsp ↔ Tsp & mL
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={tbsp}
                        onChange={(e) => setTbsp(e.target.value)}
                        className="w-20 bg-[#12100E] border border-[#C8A45D]/25 rounded-lg p-2 text-xs font-mono text-[#F4F1EA]"
                      />
                      <span className="text-xs font-mono text-[#9E9587]">tbsp =</span>
                      <span className="text-xs font-mono text-[#E5C687] font-semibold">
                        {((Number(tbsp) || 0) * 3).toFixed(0)} tsp ({Math.round((Number(tbsp) || 0) * 14.79)} mL)
                      </span>
                    </div>
                  </div>

                  {/* °F <-> °C */}
                  <div className="p-3.5 rounded-xl bg-[#0A0908]/80 border border-[#C8A45D]/20 space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A7348] block">
                      Oven: °F ↔ °C (Convection)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={fahrenheit}
                        onChange={(e) => setFahrenheit(e.target.value)}
                        className="w-20 bg-[#12100E] border border-[#C8A45D]/25 rounded-lg p-2 text-xs font-mono text-[#F4F1EA]"
                      />
                      <span className="text-xs font-mono text-[#9E9587]">°F =</span>
                      <span className="text-sm font-mono text-[#E5C687] font-semibold">
                        {Math.round(((Number(fahrenheit) || 32) - 32) * (5 / 9))} °C
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Active Multi-Channel Kitchen Timers with Stage Prompts */}
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

            <div className="space-y-4 max-h-[560px] overflow-y-auto custom-scrollbar pr-1">
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
                      className="p-5 rounded-2xl bg-[#12100E]/90 border border-[#C8A45D]/25 space-y-3"
                    >
                      {/* Flashing Mid-Cook Stage Banner */}
                      {t.activeBanner && (
                        <div className="p-3 rounded-xl bg-[#C8A45D]/20 border border-[#E5C687] flex items-center justify-between gap-2 animate-pulse">
                          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#E5C687]">
                            <AlertTriangle size={15} className="text-[#E5C687] shrink-0" />
                            <span>{t.activeBanner}</span>
                          </div>
                          <button
                            onClick={() =>
                              setTimers((prev) =>
                                prev.map((x) => (x.id === t.id ? { ...x, activeBanner: null } : x))
                              )
                            }
                            className="text-[10px] font-mono uppercase underline text-[#F4F1EA] cursor-pointer"
                          >
                            DISMISS
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-4">
                        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(200, 164, 93, 0.15)" strokeWidth="3" />
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
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {timers.length === 0 && (
                <div className="py-16 text-center space-y-2">
                  <p className="font-editorial italic text-lg text-[#9E9587]">
                    No culinary channels active. Configure a steak, egg, pour-over, or pasta channel on the left.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
