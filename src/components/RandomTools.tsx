import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Dices, Hash, RotateCw, Users, Plus, Trash2, Copy, Check } from 'lucide-react';
import { cn } from '../utils';
import { soundEngine } from '../utils/soundEngine';

type RandomTool = 'wheel' | 'teams' | 'dice' | 'coin' | 'rng';

export default function RandomTools() {
  const [activeTool, setActiveTool] = useState<RandomTool>('wheel');

  const tools = [
    { id: 'wheel' as const, label: 'FORTUNE WHEEL', icon: RotateCw },
    { id: 'teams' as const, label: 'TEAM & NAME GENERATOR', icon: Users },
    { id: 'dice' as const, label: 'POLYHEDRAL DICE LAB', icon: Dices },
    { id: 'coin' as const, label: 'SOVEREIGN COIN', icon: Coins },
    { id: 'rng' as const, label: 'NUMBER SYNTHESIS', icon: Hash },
  ];

  return (
    <div className="flex flex-col w-full space-y-8">
      {/* 5-Tool Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl glass border border-[#C8A45D]/20 max-w-4xl">
        {tools.map((tool) => {
          const active = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                soundEngine.playClick();
                setActiveTool(tool.id);
              }}
              className={cn(
                "py-3 px-3 rounded-xl text-[10px] font-semibold uppercase tracking-[0.18em] transition-all flex items-center justify-center space-x-1.5 cursor-pointer",
                active
                  ? "bg-[#C8A45D] text-[#0A0908] shadow-md"
                  : "text-[#9E9587] hover:text-[#F4F1EA]"
              )}
            >
              <tool.icon size={13} />
              <span className="truncate">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tool Display */}
      <div className="w-full min-h-[400px] flex items-center">
        <AnimatePresence mode="wait">
          {activeTool === 'wheel' && <Wheel key="wheel" />}
          {activeTool === 'teams' && <TeamGenerator key="teams" />}
          {activeTool === 'dice' && <PolyhedralDice key="dice" />}
          {activeTool === 'coin' && <CoinFlip key="coin" />}
          {activeTool === 'rng' && <RNG key="rng" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ============================================================================
 * 1. FORTUNE WHEEL (Elimination Mode + Bulk Import + History)
 * ============================================================================ */
function Wheel() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [eliminateOnWin, setEliminateOnWin] = useState(false);
  const [options, setOptions] = useState([
    'Proceed',
    'Defer',
    'Delegate',
    'Refine',
    'Approve',
    'Inquire',
  ]);
  const [newOption, setNewOption] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const spin = () => {
    if (isSpinning || options.length < 2) return;
    soundEngine.playClick();
    setIsSpinning(true);
    setWinner(null);
    setWinnerIndex(null);

    const extraRotation = 1800 + Math.random() * 1800;
    const newRotation = rotation + extraRotation;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      soundEngine.playAlarm('chime');
      const finalRotation = newRotation % 360;
      const idx = Math.floor(((360 - finalRotation) % 360) / (360 / options.length));
      const chosen = options[idx];
      setWinner(chosen);
      setWinnerIndex(idx);

      if (eliminateOnWin && options.length > 2) {
        setTimeout(() => {
          setOptions((prev) => prev.filter((_, i) => i !== idx));
        }, 1200);
      }
    }, 3600);
  };

  const addOption = () => {
    if (newOption.trim() && options.length < 24) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const applyBulk = () => {
    const list = bulkText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24);
    if (list.length >= 2) {
      setOptions(list);
      setShowBulk(false);
      setBulkText('');
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full"
    >
      <div className="lg:col-span-6 flex flex-col items-center space-y-6">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 text-[#E5C687] text-2xl drop-shadow-[0_0_10px_rgba(229,198,135,0.9)]">
            ▼
          </div>

          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 3.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full rounded-full border-2 border-[#C8A45D]/40 glass neo-shadow relative overflow-hidden"
          >
            {options.map((opt, i) => {
              const angle = 360 / options.length;
              return (
                <React.Fragment key={i}>
                  <div
                    className="absolute top-0 left-1/2 w-[1px] h-1/2 bg-[#C8A45D]/25 origin-bottom"
                    style={{ transform: `rotate(${i * angle}deg)` }}
                  />
                  <div
                    className="absolute top-0 left-1/2 h-1/2 flex items-start justify-center pt-5 origin-bottom"
                    style={{
                      transform: `rotate(${i * angle + angle / 2}deg)`,
                      width: '80px',
                      marginLeft: '-40px',
                    }}
                  >
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5C687] truncate max-w-[72px]">
                      {opt}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#12100E] border-2 border-[#C8A45D] flex items-center justify-center text-[#C8A45D] text-xs">
                ◆
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col items-center space-y-3">
          {winner && (
            <div className="px-6 py-2 rounded-full bg-[#C8A45D]/20 border border-[#C8A45D] text-sm font-editorial italic text-[#E5C687] flex items-center space-x-3">
              <span>
                Selected Decree:{' '}
                <strong className="not-italic font-sans uppercase tracking-wider ml-1">
                  {winner}
                </strong>
              </span>
              {!eliminateOnWin && winnerIndex !== null && options.length > 2 && (
                <button
                  onClick={() => {
                    removeOption(winnerIndex);
                    setWinner(null);
                  }}
                  className="text-[10px] font-mono uppercase underline text-[#F4F1EA] cursor-pointer"
                >
                  ELIMINATE
                </button>
              )}
            </div>
          )}

          <button
            onClick={spin}
            disabled={isSpinning}
            className="btn-chamfer px-10 py-4 flex items-center space-x-3 cursor-pointer"
          >
            <span className="text-[#C8A45D]">◇</span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F4F1EA]">
              {isSpinning ? 'REVOLVING...' : 'SPIN WHEEL'}
            </span>
          </button>
        </div>
      </div>

      {/* Options Manager */}
      <div className="lg:col-span-6 glass rounded-2xl p-6 border border-[#C8A45D]/20 space-y-4">
        <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
          <button
            type="button"
            onClick={() => setEliminateOnWin(!eliminateOnWin)}
            className="text-[10px] font-mono uppercase tracking-wider text-[#E5C687] cursor-pointer"
          >
            {eliminateOnWin ? '◆' : '◇'} AUTO-ELIMINATE WINNER AFTER SPIN
          </button>
          <button
            type="button"
            onClick={() => setShowBulk(!showBulk)}
            className="text-[10px] font-mono uppercase underline text-[#C8A45D] cursor-pointer"
          >
            {showBulk ? 'SINGLE INPUT' : 'BULK PASTE LIST'}
          </button>
        </div>

        {showBulk ? (
          <div className="space-y-2.5">
            <textarea
              rows={4}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Paste names or options separated by commas or newlines..."
              className="w-full bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl p-3 text-xs text-[#F4F1EA]"
            />
            <button
              onClick={applyBulk}
              className="btn-chamfer w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-[#E5C687] cursor-pointer"
            >
              LOAD SECTORS onto WHEEL
            </button>
          </div>
        ) : (
          <div className="flex gap-2.5">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOption()}
              placeholder="Inscribe new wheel sector..."
              className="flex-1 bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl px-4 py-3 text-xs text-[#F4F1EA] placeholder-[#8A7348]/60 focus:outline-none focus:border-[#C8A45D]"
            />
            <button
              onClick={addOption}
              className="btn-chamfer px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#E5C687] cursor-pointer"
            >
              ADD
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          {options.map((opt, i) => (
            <div
              key={`${i}-${opt}`}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#12100E]/80 border border-[#C8A45D]/15"
            >
              <span className="text-xs text-[#F4F1EA] truncate">{opt}</span>
              <button
                onClick={() => removeOption(i)}
                className="text-[#8A7348] hover:text-red-400 transition-colors cursor-pointer ml-2"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================================
 * 2. CLASSROOM / TEAM & RANDOM NAME PICKER
 * ============================================================================ */
function TeamGenerator() {
  const [rosterInput, setRosterInput] = useState(
    'Alexander\nBeatrice\nCassian\nDelphine\nEvander\nFlorentina\nGideon\nHelena'
  );
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<string[][]>([]);
  const [spotlightName, setSpotlightName] = useState<string | null>(null);
  const [copiedTeams, setCopiedTeams] = useState(false);

  const getNames = () =>
    rosterInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const generateTeams = () => {
    soundEngine.playClick();
    const names = [...getNames()];
    // Fisher-Yates shuffle
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }
    const k = Math.max(2, Math.min(names.length, teamCount));
    const buckets: string[][] = Array.from({ length: k }, () => []);
    names.forEach((n, idx) => {
      buckets[idx % k].push(n);
    });
    setTeams(buckets);
  };

  const pickSpotlightName = () => {
    const names = getNames();
    if (names.length === 0) return;
    soundEngine.playAlarm('beep');
    const chosen = names[Math.floor(Math.random() * names.length)];
    setSpotlightName(chosen);
  };

  const copyTeams = () => {
    const text = teams
      .map((t, i) => `House / Team ${i + 1}: ${t.join(', ')}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTeams(true);
    setTimeout(() => setCopiedTeams(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start"
    >
      <div className="lg:col-span-5 glass rounded-2xl p-6 border border-[#C8A45D]/20 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-editorial text-2xl text-[#F4F1EA]">Participant Roster</h3>
          <span className="text-[10px] font-mono text-[#E5C687]">
            {getNames().length} PARTICIPANTS
          </span>
        </div>
        <textarea
          rows={7}
          value={rosterInput}
          onChange={(e) => setRosterInput(e.target.value)}
          placeholder="Enter one name per line or comma-separated..."
          className="w-full bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl p-3.5 text-xs font-mono text-[#F4F1EA] focus:outline-none focus:border-[#C8A45D]"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase text-[#8A7348]">TEAMS:</span>
            <input
              type="number"
              min={2}
              max={12}
              value={teamCount}
              onChange={(e) => setTeamCount(Number(e.target.value))}
              className="w-16 bg-[#0A0908] border border-[#C8A45D]/25 rounded-lg p-2 text-xs font-mono text-[#F4F1EA]"
            />
          </div>
          <button
            onClick={generateTeams}
            className="btn-chamfer px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E5C687] cursor-pointer"
          >
            ◇ SPLIT TEAMS
          </button>
          <button
            onClick={pickSpotlightName}
            className="btn-chamfer px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F4F1EA] cursor-pointer"
          >
            PICK 1
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 glass rounded-2xl p-6 border border-[#C8A45D]/20 space-y-5">
        {spotlightName && (
          <div className="p-4 rounded-xl bg-[#C8A45D]/20 border border-[#E5C687] flex items-center justify-between">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#E5C687] block">
                SPOTLIGHT SELECTION
              </span>
              <span className="font-editorial text-3xl text-[#F4F1EA]">{spotlightName}</span>
            </div>
            <button
              onClick={() => setSpotlightName(null)}
              className="text-[10px] font-mono uppercase text-[#E5C687] underline cursor-pointer"
            >
              CLEAR
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-[#C8A45D]/15 pb-3">
          <h3 className="font-editorial text-2xl text-[#F4F1EA]">Balanced Team Allocations</h3>
          {teams.length > 0 && (
            <button
              onClick={copyTeams}
              className="text-[10px] font-mono uppercase tracking-wider text-[#E5C687] flex items-center space-x-1 cursor-pointer"
            >
              {copiedTeams ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedTeams ? 'COPIED' : 'COPY TEAMS'}</span>
            </button>
          )}
        </div>

        {teams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teams.map((group, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#12100E] border border-[#C8A45D]/25 space-y-2"
              >
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#C8A45D] font-bold">
                  ◆ DIVISION {idx + 1} ({group.length})
                </div>
                <ul className="space-y-1 text-xs text-[#F4F1EA]">
                  {group.map((member, mIdx) => (
                    <li key={mIdx} className="font-mono text-[#E5C687]">
                      {mIdx + 1}. {member}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center font-editorial italic text-base text-[#9E9587]">
            Click "SPLIT TEAMS" to randomly distribute your roster into balanced divisions, or "PICK 1" to draw a random individual.
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================================
 * 3. POLYHEDRAL RPG & TABLETOP DICE LAB (d4, d6, d8, d10, d12, d20, d100)
 * ============================================================================ */
function PolyhedralDice() {
  const [dieSides, setDieSides] = useState<number>(20);
  const [dieCount, setDieCount] = useState<number>(2);
  const [modifier, setModifier] = useState<number>(0);
  const [rolls, setRolls] = useState<number[]>([14, 19]);
  const [history, setHistory] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  const rollPolyhedral = () => {
    if (isRolling) return;
    soundEngine.playClick();
    setIsRolling(true);

    setTimeout(() => {
      const next = Array.from(
        { length: dieCount },
        () => Math.floor(Math.random() * dieSides) + 1
      );
      setRolls(next);
      const rawSum = next.reduce((a, b) => a + b, 0);
      const total = rawSum + modifier;
      const modStr = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : '';
      setHistory((prev) => [
        `${dieCount}d${dieSides}${modStr} → [${next.join(', ')}] = ${total}`,
        ...prev.slice(0, 7),
      ]);
      setIsRolling(false);
    }, 450);
  };

  const rawSum = rolls.reduce((a, b) => a + b, 0);
  const finalTotal = rawSum + modifier;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center"
    >
      <div className="lg:col-span-7 space-y-6">
        <div className="flex flex-wrap gap-2">
          {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
            <button
              key={sides}
              onClick={() => setDieSides(sides)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider border cursor-pointer transition-all",
                dieSides === sides
                  ? "bg-[#C8A45D] text-[#0A0908] border-[#E5C687] font-bold"
                  : "bg-[#12100E] text-[#9E9587] border-[#C8A45D]/20 hover:text-[#F4F1EA]"
              )}
            >
              d{sides}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          {rolls.map((val, idx) => {
            const isCrit = val === dieSides;
            const isFail = val === 1;
            return (
              <motion.div
                key={`${idx}-${val}`}
                animate={isRolling ? { rotate: [0, 180, 360], scale: [1, 1.15, 1] } : {}}
                className={cn(
                  "w-24 h-24 rounded-2xl glass border flex flex-col items-center justify-center neo-shadow",
                  isCrit
                    ? "border-emerald-400 bg-emerald-500/10"
                    : isFail
                    ? "border-red-400 bg-red-500/10"
                    : "border-[#C8A45D]/35"
                )}
              >
                <span className="text-[9px] font-mono text-[#8A7348]">d{dieSides}</span>
                <span className="text-3xl font-mono font-light text-[#F4F1EA]">{val}</span>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={rollPolyhedral}
            className="btn-chamfer px-9 py-4 flex items-center space-x-3 cursor-pointer"
          >
            <span className="text-[#C8A45D]">◇</span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F4F1EA]">
              ROLL {dieCount}d{dieSides} (TOTAL: {finalTotal})
            </span>
          </button>

          <div className="flex items-center space-x-2 glass px-3 py-2 rounded-xl border border-[#C8A45D]/20">
            <span className="text-[10px] font-mono text-[#8A7348]">QTY</span>
            <input
              type="number"
              min={1}
              max={8}
              value={dieCount}
              onChange={(e) => setDieCount(Math.max(1, Math.min(8, Number(e.target.value))))}
              className="w-12 bg-[#0A0908] border border-[#C8A45D]/25 rounded-lg p-1.5 text-xs font-mono text-[#F4F1EA] text-center"
            />
            <span className="text-[10px] font-mono text-[#8A7348] ml-2">MOD</span>
            <input
              type="number"
              min={-50}
              max={50}
              value={modifier}
              onChange={(e) => setModifier(Number(e.target.value))}
              className="w-14 bg-[#0A0908] border border-[#C8A45D]/25 rounded-lg p-1.5 text-xs font-mono text-[#E5C687] text-center"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 glass rounded-2xl p-6 border border-[#C8A45D]/20 space-y-3">
        <h3 className="font-editorial text-xl text-[#F4F1EA] border-b border-[#C8A45D]/15 pb-2">
          Roll Telemetry Log
        </h3>
        <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
          {history.length > 0 ? (
            history.map((h, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[#12100E] border border-[#C8A45D]/15 text-xs font-mono text-[#E5C687]"
              >
                {h}
              </div>
            ))
          ) : (
            <p className="text-xs text-[#9E9587] italic">Cast dice to populate roll log.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================================
 * 4. SOVEREIGN COIN FLIP (With Heads/Tails Tally)
 * ============================================================================ */
function CoinFlip() {
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [headsCount, setHeadsCount] = useState(0);
  const [tailsCount, setTailsCount] = useState(0);

  const flip = () => {
    if (isFlipping) return;
    soundEngine.playClick();
    setIsFlipping(true);
    setResult(null);

    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'heads' : 'tails';
      setResult(outcome);
      if (outcome === 'heads') setHeadsCount((c) => c + 1);
      else setTailsCount((c) => c + 1);
      setIsFlipping(false);
    }, 850);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center w-full"
    >
      <div className="md:col-span-6 flex flex-col items-center space-y-8">
        <div className="relative w-60 h-60 perspective-1000">
          <motion.div
            animate={
              isFlipping
                ? { rotateY: [0, 720, 1440, 2160], y: [0, -120, 0], scale: [1, 1.2, 1] }
                : { rotateY: result === 'tails' ? 180 : 0 }
            }
            transition={{ duration: 0.85, ease: 'easeInOut' }}
            className="w-full h-full relative preserve-3d cursor-pointer"
            onClick={flip}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E5C687] via-[#C8A45D] to-[#6E562A] border-4 border-[#E5C687] flex flex-col items-center justify-center backface-hidden shadow-[0_0_55px_rgba(200,164,93,0.35)]">
              <div className="absolute inset-2 rounded-full border border-dashed border-[#0A0908]/40" />
              <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-[#0A0908]/70 font-bold mb-2">
                HAUTE HORLOGERIE
              </span>
              <span className="font-editorial text-4xl font-semibold text-[#0A0908] tracking-widest">
                OBVERSE
              </span>
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#0A0908]/80 mt-2 font-bold">
                ◆ HEADS ◆
              </span>
            </div>

            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C8A45D] via-[#8A7348] to-[#3B2E16] border-4 border-[#C8A45D] flex flex-col items-center justify-center backface-hidden rotate-y-180 shadow-[0_0_55px_rgba(200,164,93,0.35)]">
              <div className="absolute inset-2 rounded-full border border-dashed border-[#F4F1EA]/30" />
              <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-[#F4F1EA]/70 font-bold mb-2">
                ANNO MMXXVI
              </span>
              <span className="font-editorial text-4xl font-semibold text-[#F4F1EA] tracking-widest">
                REVERSE
              </span>
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#E5C687] mt-2 font-bold">
                ◆ TAILS ◆
              </span>
            </div>
          </motion.div>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={flip}
          disabled={isFlipping}
          className="btn-chamfer px-10 py-4 flex items-center space-x-3 cursor-pointer"
        >
          <span className="text-[#C8A45D]">◇</span>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F4F1EA]">
            {isFlipping ? 'CASTING SOVEREIGN...' : 'FLIP SOVEREIGN'}
          </span>
        </motion.button>
      </div>

      <div className="md:col-span-6 glass rounded-2xl p-8 border border-[#C8A45D]/20 text-center space-y-5">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#8A7348]">
          DECREE OF FORTUNE
        </span>
        <div className="font-editorial text-4xl text-[#E5C687] py-2">
          {isFlipping
            ? 'In flight...'
            : result
            ? result === 'heads'
              ? 'Obverse — Heads'
              : 'Reverse — Tails'
            : 'Awaiting your toss'}
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#C8A45D]/15">
          <div className="p-3 rounded-xl bg-[#12100E]">
            <span className="text-[10px] font-mono text-[#8A7348] block">HEADS TALLY</span>
            <span className="text-xl font-mono text-[#E5C687]">{headsCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#12100E]">
            <span className="text-[10px] font-mono text-[#8A7348] block">TAILS TALLY</span>
            <span className="text-xl font-mono text-[#F4F1EA]">{tailsCount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================================
 * 5. NUMBER SYNTHESIS (RNG with Sort & Copy)
 * ============================================================================ */
function RNG() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(5);
  const [allowRepeats, setAllowRepeats] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [results, setResults] = useState<number[]>([7, 24, 42, 68, 88]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = () => {
    if (isGenerating) return;
    const rangeSize = max - min + 1;
    if (!allowRepeats && count > rangeSize) return;
    soundEngine.playClick();

    setIsGenerating(true);
    setTimeout(() => {
      let arr: number[];
      if (allowRepeats) {
        arr = Array.from({ length: count }, () => Math.floor(Math.random() * rangeSize) + min);
      } else {
        const set = new Set<number>();
        while (set.size < count) {
          set.add(Math.floor(Math.random() * rangeSize) + min);
        }
        arr = Array.from(set);
      }
      if (sortAsc) arr.sort((a, b) => a - b);
      setResults(arr);
      setIsGenerating(false);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center"
    >
      <div className="lg:col-span-6 glass rounded-2xl p-8 min-h-[200px] flex flex-wrap items-center justify-center gap-4 border border-[#C8A45D]/25">
        {results.map((r, i) => (
          <motion.div
            key={`${i}-${r}`}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-6 py-4 rounded-xl bg-[#C8A45D]/15 border border-[#C8A45D]/40 text-[#E5C687] font-mono text-3xl font-light"
          >
            {r}
          </motion.div>
        ))}
      </div>

      <div className="lg:col-span-6 glass rounded-2xl p-6 space-y-5 border border-[#C8A45D]/20">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-[#8A7348] block mb-1.5">
              Min
            </label>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              className="w-full bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl p-3 text-xs font-mono text-[#F4F1EA]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-[#8A7348] block mb-1.5">
              Max
            </label>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="w-full bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl p-3 text-xs font-mono text-[#F4F1EA]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-[#8A7348] block mb-1.5">
              Count
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value))))}
              className="w-full bg-[#0A0908] border border-[#C8A45D]/25 rounded-xl p-3 text-xs font-mono text-[#F4F1EA]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setAllowRepeats(!allowRepeats)}
            className="flex items-center space-x-2 text-xs text-[#9E9587] hover:text-[#F4F1EA] cursor-pointer"
          >
            <span className="text-[#C8A45D]">{allowRepeats ? '◆' : '◇'}</span>
            <span className="uppercase tracking-[0.2em] text-[10px]">Allow duplicates</span>
          </button>

          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center space-x-2 text-xs text-[#9E9587] hover:text-[#F4F1EA] cursor-pointer"
          >
            <span className="text-[#C8A45D]">{sortAsc ? '◆' : '◇'}</span>
            <span className="uppercase tracking-[0.2em] text-[10px]">Sort ascending</span>
          </button>
        </div>

        <button
          onClick={generate}
          className="btn-chamfer w-full py-4 flex items-center justify-center space-x-2.5 cursor-pointer"
        >
          <span className="text-[#C8A45D]">◇</span>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F4F1EA]">
            SYNTHESIZE NUMBERS
          </span>
        </button>
      </div>
    </motion.div>
  );
}
