import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Timer as TimerIcon,
  Clock,
  Brain,
  Sparkles,
  Dices,
  Info,
  Shield,
  FileText,
  Utensils,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Share2,
  Check,
  Bell,
} from 'lucide-react';
import Stopwatch from './components/Stopwatch';
import Timer from './components/Timer';
import Pomodoro from './components/Pomodoro';
import KitchenHub from './components/KitchenHub';
import RandomTools from './components/RandomTools';
import AIAssistant from './components/AIAssistant';
import LegalModal from './components/LegalModal';
import { cn } from './utils';
import { TimerType } from './types';
import { soundEngine, AlarmProfile } from './utils/soundEngine';

const DEFAULT_TITLE = 'STOPWATCH+ | Online Stopwatch, Timer & Pomodoro Tracker';

export default function App() {
  const [activeTab, setActiveTab] = useState<TimerType>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab') as TimerType | null;
    if (urlTab && ['stopwatch', 'timer', 'pomodoro', 'kitchen', 'random'].includes(urlTab)) {
      return urlTab;
    }
    const saved = localStorage.getItem('stopwatch_active_tab');
    return (saved as TimerType) || 'stopwatch';
  });

  const [showAI, setShowAI] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'about' | null>(null);

  // Deep-link / Command timer injection
  const [commandTimerSeconds, setCommandTimerSeconds] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const dur = params.get('duration');
    return dur ? Number(dur) : null;
  });
  const [commandTimerLabel, setCommandTimerLabel] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('label');
  });

  // Sound Settings State
  const [soundProfile, setSoundProfile] = useState<AlarmProfile>(soundEngine.getProfile());
  const [soundVolume, setSoundVolume] = useState<number>(soundEngine.getVolume());
  const [soundMuted, setSoundMuted] = useState<boolean>(soundEngine.isMuted());

  useEffect(() => {
    localStorage.setItem('stopwatch_active_tab', activeTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', url.toString());
  }, [activeTab]);

  // Dynamic Browser Tab Title callback
  const handleTitleUpdate = useCallback((customTitle: string | null) => {
    document.title = customTitle || DEFAULT_TITLE;
  }, []);

  // Fullscreen Cinema / Projector Mode toggle (`F` key)
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [toggleFullscreen]);

  const handleShareCurrentView = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const tabs = [
    {
      id: 'stopwatch' as const,
      label: 'STOPWATCH',
      railLabel: 'CHRONOGRAPH',
      icon: Clock,
      microHeading: 'PRECISION TIMEKEEPING SUITE',
      headlineMain: 'Every second counts when ',
      headlineAccent: 'you do.',
      description: 'Zero-drift quartz telemetry, split-lap pace analytics, HIIT interval synthesis, and dual Fischer chess clocks.'
    },
    {
      id: 'timer' as const,
      label: 'TIMER',
      railLabel: 'COUNTDOWN',
      icon: TimerIcon,
      microHeading: 'HOROLOGICAL COUNTDOWN',
      headlineMain: 'Master the art of ',
      headlineAccent: 'anticipation.',
      description: 'Custom countdown intervals with deep-link sharing, synthesized chimes, and champagne-gold progress rings.'
    },
    {
      id: 'pomodoro' as const,
      label: 'POMODORO',
      railLabel: 'FOCUS',
      icon: Brain,
      microHeading: 'COGNITIVE CADENCE ENGINE',
      headlineMain: 'Deep focus crafted in ',
      headlineAccent: 'golden intervals.',
      description: 'Structured work cycles paired with an Executive Focus Ledger and procedural Brown Noise, Pink Rain & 40Hz Gamma audio.'
    },
    {
      id: 'kitchen' as const,
      label: 'KITCHEN',
      railLabel: 'CULINARY',
      icon: Utensils,
      microHeading: 'GASTRONOMIC CHRONOMETRY',
      headlineMain: 'Culinary perfection to the ',
      headlineAccent: 'exact degree.',
      description: 'Multi-channel culinary timers for eggs, steak thickness & resting, artisan pasta, and botanical tea infusions.'
    },
    {
      id: 'random' as const,
      label: 'RANDOM',
      railLabel: 'FORTUNE',
      icon: Dices,
      microHeading: 'STOCHASTIC DECISION SUITE',
      headlineMain: 'Leave nothing to mere ',
      headlineAccent: 'coincidence.',
      description: 'Bespoke decision instruments including sovereign coin toss, polyhedral dice, number synthesis, and fortune wheel.'
    },
  ];

  const currentTabInfo = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[#0A0908] text-[#F4F1EA] relative selection:bg-[#C8A45D]/30 selection:text-[#F4F1EA]">
      {/* Luxury Celestial & Chronograph Background Layer */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#0A0908]">
        <div 
          className="absolute right-0 bottom-0 w-full lg:w-[78%] h-[85%] bg-no-repeat bg-right-bottom bg-cover opacity-85 transition-opacity duration-1000"
          style={{
            backgroundImage: `url('/hero-bg.jpg')`,
            maskImage: 'radial-gradient(ellipse 85% 85% at 80% 75%, rgba(0,0,0,1) 25%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 95%)',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 80% 75%, rgba(0,0,0,1) 25%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 95%)',
          }}
        />

        <div 
          className="absolute right-[-5%] bottom-[-8%] w-[560px] h-[560px] bg-no-repeat bg-contain bg-center opacity-[0.14] mix-blend-screen pointer-events-none hidden xl:block"
          style={{
            backgroundImage: `url('/emblem.jpg')`,
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0908] via-[#0A0908]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0908] via-transparent to-[#0A0908]/90" />
        <div className="absolute top-[15%] left-[10%] w-[35%] h-[35%] bg-[#C8A45D]/[0.04] rounded-full blur-[130px]" />

        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 3 === 0 ? '2px' : '1.5px',
              height: i % 3 === 0 ? '2px' : '1.5px',
              backgroundColor: i % 2 === 0 ? '#E5C687' : '#C8A45D',
              boxShadow: '0 0 6px rgba(229, 198, 135, 0.8)',
              left: `${(i * 19 + 7) % 95}%`,
              top: `${(i * 23 + 11) % 92}%`,
            }}
            animate={{
              y: [0, -25, 0],
              opacity: [0.15, 0.75, 0.15],
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 6 + (i % 5) * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i % 6) * 0.8,
            }}
          />
        ))}
      </div>

      {/* Top Editorial Header (Hidden in Cinema Fullscreen mode unless hovered) */}
      <header className={cn(
        "sticky top-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between max-w-[1600px] mx-auto w-full backdrop-blur-md border-b border-[#C8A45D]/10 transition-opacity duration-300",
        isFullscreen && "opacity-20 hover:opacity-100"
      )}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setActiveTab('stopwatch')}
          className="flex items-center space-x-3.5 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden border border-[#C8A45D]/40 bg-[#12100E] flex items-center justify-center shadow-[0_0_20px_rgba(200,164,93,0.2)] group-hover:border-[#E5C687] transition-all duration-500">
            <img src="/emblem.jpg" alt="Astrolabe Emblem" className="w-full h-full object-cover scale-110" />
          </div>
          <div className="flex items-baseline">
            <span className="font-editorial text-2xl md:text-3xl font-semibold tracking-tight text-[#F4F1EA]">
              Stopwatch
            </span>
            <span className="font-editorial text-2xl md:text-3xl font-semibold text-[#C8A45D]">.</span>
          </div>
        </motion.div>

        {/* Center Wide-Tracked Navigation */}
        <nav className="hidden lg:flex items-center space-x-8 xl:space-x-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  handleTitleUpdate(null);
                  setActiveTab(tab.id);
                }}
                className={cn(
                  "relative py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer",
                  isActive 
                    ? "text-[#E5C687]" 
                    : "text-[#9E9587] hover:text-[#F4F1EA]"
                )}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="top-nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C8A45D] to-transparent"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Top-Right Utility Controls & QUICK COMMAND */}
        <div className="flex items-center space-x-2.5">
          {/* Audio Synthesizer Studio Popover Button */}
          <div className="relative">
            <button
              onClick={() => setShowSoundModal(!showSoundModal)}
              title="Web Audio Synthesizer & Alarm Profiles"
              className={cn(
                "p-2.5 rounded-full glass transition-colors flex items-center justify-center cursor-pointer",
                soundMuted
                  ? "text-red-400 border-red-500/30"
                  : showSoundModal
                  ? "text-[#0A0908] bg-[#C8A45D] border-[#E5C687]"
                  : "text-[#E5C687] hover:border-[#C8A45D]"
              )}
            >
              {soundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <AnimatePresence>
              {showSoundModal && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute right-0 mt-3 w-72 glass rounded-2xl p-5 neo-shadow border border-[#C8A45D]/35 z-50 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#E5C687]">
                      ACOUSTIC SYNTHESIZER
                    </span>
                    <button
                      onClick={() => {
                        const next = !soundMuted;
                        setSoundMuted(next);
                        soundEngine.setMuted(next);
                      }}
                      className="text-[10px] font-mono uppercase text-[#C8A45D] hover:underline cursor-pointer"
                    >
                      {soundMuted ? 'UNMUTE' : 'MUTE ALL'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A7348] block">
                      Alarm Profile
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'chime' as const, label: 'Horological Chime' },
                        { id: 'bowl' as const, label: 'Singing Bowl' },
                        { id: 'beep' as const, label: 'Quartz Beep' },
                        { id: 'pulse' as const, label: 'Urgency Pulse' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSoundProfile(p.id);
                            soundEngine.setProfile(p.id);
                            soundEngine.playAlarm(p.id);
                          }}
                          className={cn(
                            "p-2 rounded-lg text-[10px] font-medium border text-left transition-all cursor-pointer",
                            soundProfile === p.id
                              ? "bg-[#C8A45D]/25 border-[#C8A45D] text-[#E5C687]"
                              : "bg-[#12100E] border-[#C8A45D]/15 text-[#9E9587] hover:text-[#F4F1EA]"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-[#9E9587]">
                      <span>MASTER GAIN</span>
                      <span>{Math.round(soundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={soundVolume}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setSoundVolume(v);
                        soundEngine.setVolume(v);
                      }}
                      className="w-full accent-[#C8A45D] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#C8A45D]/15">
                    <button
                      onClick={() => soundEngine.playAlarm()}
                      className="text-[10px] font-mono uppercase tracking-wider text-[#E5C687] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Bell size={12} className="text-[#C8A45D]" />
                      <span>TEST CHIME</span>
                    </button>
                    <button
                      onClick={() => soundEngine.notify('Stopwatch+ Notification Active', 'Desktop alerts are enabled.')}
                      className="text-[10px] font-mono uppercase tracking-wider text-[#9E9587] hover:text-[#E5C687] cursor-pointer"
                    >
                      ENABLE ALERTS
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Share Link Button */}
          <button
            onClick={handleShareCurrentView}
            title="Copy Shareable Link"
            className="p-2.5 rounded-full glass text-[#E5C687] hover:border-[#C8A45D] transition-colors hidden sm:flex items-center justify-center cursor-pointer"
          >
            {copiedUrl ? <Check size={15} /> : <Share2 size={15} />}
          </button>

          {/* Fullscreen Cinema Mode Button (F) */}
          <button
            onClick={toggleFullscreen}
            title="Cinema / Projector Fullscreen Mode (Press F)"
            className="p-2.5 rounded-full glass text-[#E5C687] hover:border-[#C8A45D] transition-colors hidden sm:flex items-center justify-center cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAI(!showAI)}
            className={cn(
              "px-5 py-2.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 flex items-center space-x-2.5 cursor-pointer border",
              showAI 
                ? "bg-[#C8A45D] text-[#0A0908] border-[#E5C687] accent-glow" 
                : "bg-[#C8A45D]/15 text-[#E5C687] border-[#C8A45D]/40 hover:bg-[#C8A45D]/25 hover:border-[#E5C687]"
            )}
          >
            <Sparkles size={14} className={showAI ? "text-[#0A0908]" : "text-[#C8A45D]"} />
            <span className="hidden sm:inline">QUICK COMMAND</span>
          </motion.button>

          <button 
            onClick={() => setLegalModal('about')}
            title="About Stopwatch."
            className="p-2.5 rounded-full glass text-[#8A7348] hover:text-[#E5C687] hover:border-[#C8A45D]/40 transition-colors hidden md:flex items-center justify-center cursor-pointer"
          >
            <Info size={16} />
          </button>
        </div>
      </header>

      {/* Right-Side Fixed Vertical Navigation Rail */}
      {!isFullscreen && (
        <aside className="hidden xl:flex fixed right-8 top-1/2 -translate-y-1/2 z-40 flex-col items-end space-y-6 py-8 pr-4 border-r border-[#C8A45D]/20">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  handleTitleUpdate(null);
                  setActiveTab(tab.id);
                }}
                className="group flex items-center space-x-3 text-right cursor-pointer py-1"
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.25em] transition-all duration-300",
                    isActive
                      ? "text-[#E5C687] gold-text-glow"
                      : "text-[#8A7348]/70 group-hover:text-[#F4F1EA]"
                  )}
                >
                  {tab.railLabel}
                </span>
                <span
                  className={cn(
                    "text-xs transition-all duration-300",
                    isActive
                      ? "text-[#C8A45D] scale-110 drop-shadow-[0_0_8px_rgba(229,198,135,0.8)]"
                      : "text-[#8A7348]/30 group-hover:text-[#C8A45D]/60"
                  )}
                >
                  ◆
                </span>
              </button>
            );
          })}
        </aside>
      )}

      {/* Main Content Area with Left Editorial Framing */}
      <main className="flex-1 flex flex-col justify-center px-6 md:px-12 xl:px-20 py-10 relative max-w-[1600px] mx-auto w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-12 items-start">
          <div className={cn(
            "transition-all duration-700 ease-in-out",
            showAI ? "lg:col-span-8" : "lg:col-span-12"
          )}>
            {/* Editorial Header Block with Left Vertical Gold Hairline */}
            {!isFullscreen && (
              <motion.div
                key={`editorial-${activeTab}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative pl-6 md:pl-8 border-l border-[#C8A45D]/40 mb-10 max-w-3xl"
              >
                <span className="absolute -left-[4.5px] top-0 text-[10px] text-[#C8A45D] leading-none">◆</span>
                
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#C8A45D] font-semibold">
                    {currentTabInfo.microHeading}
                  </span>
                </div>

                <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[#F4F1EA] leading-[1.08]">
                  {currentTabInfo.headlineMain}
                  <span className="italic font-normal text-[#C8A45D] gold-text-glow">
                    {currentTabInfo.headlineAccent}
                  </span>
                </h1>

                <p className="mt-4 text-xs md:text-sm text-[#9E9587] max-w-xl leading-relaxed font-normal">
                  {currentTabInfo.description}
                </p>
              </motion.div>
            )}

            {/* Tool Container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {activeTab === 'stopwatch' && <Stopwatch onTitleUpdate={handleTitleUpdate} />}
                {activeTab === 'timer' && (
                  <Timer 
                    externalSeconds={commandTimerSeconds}
                    externalLabel={commandTimerLabel}
                    onClearExternalSeconds={() => {
                      setCommandTimerSeconds(null);
                      setCommandTimerLabel(null);
                    }}
                    onTitleUpdate={handleTitleUpdate}
                  />
                )}
                {activeTab === 'pomodoro' && <Pomodoro onTitleUpdate={handleTitleUpdate} />}
                {activeTab === 'kitchen' && <KitchenHub onTitleUpdate={handleTitleUpdate} />}
                {activeTab === 'random' && <RandomTools />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Quick Command / AI Assistant Sidebar */}
          <AnimatePresence>
            {showAI && (
              <motion.div
                initial={{ opacity: 0, x: 60, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.97 }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.55 }}
                className="lg:col-span-4 w-full lg:sticky lg:top-28"
              >
                <AIAssistant 
                  onSetStopwatch={() => setActiveTab('stopwatch')}
                  onSetPomodoro={() => setActiveTab('pomodoro')}
                  onSetKitchen={() => setActiveTab('kitchen')}
                  onSetRandom={() => setActiveTab('random')}
                  onSetTimer={(seconds) => {
                    setCommandTimerSeconds(seconds);
                    setActiveTab('timer');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom "SCROLL" Mouse-Wheel Indicator */}
        {!isFullscreen && (
          <div className="mt-16 mb-6 flex flex-col items-center justify-center space-y-2.5 opacity-60 hover:opacity-100 transition-opacity pointer-events-none select-none">
            <div className="w-5 h-8 rounded-full border border-[#C8A45D]/50 flex items-start justify-center p-1.5">
              <motion.div
                animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-1 h-2 rounded-full bg-[#C8A45D]"
              />
            </div>
            <span className="text-[9px] uppercase tracking-[0.35em] text-[#8A7348] font-semibold">
              SCROLL
            </span>
          </div>
        )}
      </main>

      {/* Mobile Navigation Bar */}
      {!isFullscreen && (
        <nav className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 p-1.5 rounded-2xl glass border-[#C8A45D]/25 flex items-center space-x-1 z-50 w-[94%] max-w-md neo-shadow">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  handleTitleUpdate(null);
                  setActiveTab(tab.id);
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 py-2.5 rounded-xl transition-all duration-300 cursor-pointer",
                  isActive ? "text-[#0A0908]" : "text-[#9E9587]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 bg-gradient-to-br from-[#E5C687] to-[#C8A45D] rounded-xl -z-10 shadow-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon size={18} />
                <span className="text-[9px] mt-1 font-bold uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Luxury Minimal Footer */}
      {!isFullscreen && (
        <footer className="px-6 md:px-12 py-8 border-t border-[#C8A45D]/10 pb-28 lg:pb-8 max-w-[1600px] mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A7348]">
          <div className="flex items-center space-x-3">
            <span className="text-[#C8A45D]">◆</span>
            <span className="tracking-[0.2em] uppercase text-[10px]">
              © 2026 STOPWATCH. HAUTE HORLOGERIE DIGITAL SUITE
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <button 
              onClick={() => setLegalModal('terms')}
              className="text-[#9E9587] hover:text-[#E5C687] transition-colors text-[11px] uppercase tracking-[0.15em] flex items-center space-x-1.5 cursor-pointer"
            >
              <FileText size={13} className="text-[#C8A45D]" />
              <span>Terms</span>
            </button>
            <button 
              onClick={() => setLegalModal('privacy')}
              className="text-[#9E9587] hover:text-[#E5C687] transition-colors text-[11px] uppercase tracking-[0.15em] flex items-center space-x-1.5 cursor-pointer"
            >
              <Shield size={13} className="text-[#C8A45D]" />
              <span>Privacy</span>
            </button>
            <button 
              onClick={() => setLegalModal('about')}
              className="text-[#9E9587] hover:text-[#E5C687] transition-colors text-[11px] uppercase tracking-[0.15em] flex items-center space-x-1.5 cursor-pointer"
            >
              <Info size={13} className="text-[#C8A45D]" />
              <span>Atelier</span>
            </button>
          </div>
        </footer>
      )}

      <AnimatePresence>
        {legalModal && (
          <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
