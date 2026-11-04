import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Send, Sparkles, Loader2, Terminal } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn, formatTimer } from '../utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  onSetTimer?: (seconds: number) => void;
  onSetStopwatch?: () => void;
  onSetPomodoro?: () => void;
  onSetKitchen?: () => void;
  onSetRandom?: () => void;
}

/**
 * Offline Smart Command Parser — parses natural language commands locally
 * so Quick Command works instantaneously without requiring an external API key.
 */
function parseOfflineCommand(
  raw: string,
  callbacks: AIAssistantProps
): string | null {
  const text = raw.toLowerCase().trim();

  // Check for duration expressions like "10m", "5 minutes", "1 hour 30 min", "45 sec"
  let totalSeconds = 0;
  const hourMatch = text.match(/(\d+)\s*(?:hours?|hrs?|h)\b/);
  const minMatch = text.match(/(\d+)\s*(?:minutes?|mins?|m)\b/);
  const secMatch = text.match(/(\d+)\s*(?:seconds?|secs?|s)\b/);

  if (hourMatch) totalSeconds += parseInt(hourMatch[1], 10) * 3600;
  if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;
  if (secMatch) totalSeconds += parseInt(secMatch[1], 10);

  if (totalSeconds > 0) {
    callbacks.onSetTimer?.(totalSeconds);
    return `Calibrated countdown timer for **${formatTimer(totalSeconds)}** and switched to the **COUNTDOWN** dial.`;
  }

  if (text.includes('stopwatch') || text.includes('chronograph') || text.includes('lap')) {
    callbacks.onSetStopwatch?.();
    return `Switched to the **CHRONOGRAPH** dial. Press \`SPACE\` to start or pause, and \`L\` to record a split.`;
  }

  if (text.includes('pomodoro') || text.includes('focus') || text.includes('study') || text.includes('work')) {
    callbacks.onSetPomodoro?.();
    return `Activated **FOCUS (Pomodoro)** cadence: 25 minutes of cognitive immersion followed by a 5-minute restoration break.`;
  }

  if (
    text.includes('kitchen') ||
    text.includes('egg') ||
    text.includes('steak') ||
    text.includes('pasta') ||
    text.includes('tea') ||
    text.includes('cook')
  ) {
    callbacks.onSetKitchen?.();
    return `Opened **CULINARY CHRONOMETRY** with calibrated presets for soft/jammy eggs, steak thickness & resting, pasta, and botanical tea steepings.`;
  }

  if (
    text.includes('random') ||
    text.includes('coin') ||
    text.includes('dice') ||
    text.includes('wheel') ||
    text.includes('flip') ||
    text.includes('roll')
  ) {
    callbacks.onSetRandom?.();
    return `Switched to the **FORTUNE** suite for sovereign coin tosses, dice casting, and the customizable decision wheel.`;
  }

  return null;
}

export default function AIAssistant(props: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Welcome to **Quick Command**. Works instantaneously offline or with Gemini AI.\n\nTry commands such as:\n- `Set a timer for 12 minutes 30 seconds`\n- `Start Pomodoro focus`\n- `Open Kitchen timers for steak`\n- `Switch to Stopwatch`",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (presetText?: string) => {
    const userMessage = (presetText ?? input).trim();
    if (!userMessage || isLoading) return;

    if (!presetText) setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    // 1. Try offline smart parser first for zero-latency execution
    const offlineReply = parseOfflineCommand(userMessage, props);
    if (offlineReply) {
      setMessages((prev) => [...prev, { role: 'assistant', content: offlineReply }]);
      return;
    }

    // 2. If no direct command matched, check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Offline Command Engine is active. Try specifying a duration (e.g., `15m`, `45s`, `1h 20m`) or naming a suite (`stopwatch`, `pomodoro`, `kitchen`, `random`).",
        },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: `You are the horological concierge for Stopwatch., a luxury timekeeping suite.
          If the user wants to set a timer, extract the duration in seconds and call set_timer.
          If the user wants to start a stopwatch, call start_stopwatch.
          If the user wants to start a pomodoro session, call start_pomodoro.
          Be concise, refined, and helpful.`,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "set_timer",
                  description: "Set a countdown timer in seconds",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      seconds: { type: Type.NUMBER, description: "Duration in seconds" },
                    },
                    required: ["seconds"],
                  },
                },
                {
                  name: "start_stopwatch",
                  description: "Switch to the stopwatch",
                  parameters: { type: Type.OBJECT, properties: {} },
                },
                {
                  name: "start_pomodoro",
                  description: "Switch to Pomodoro focus mode",
                  parameters: { type: Type.OBJECT, properties: {} },
                },
              ],
            },
          ],
        },
      });

      const text = response.text || "Command executed.";
      const functionCalls = response.functionCalls;

      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'set_timer' && props.onSetTimer) {
            props.onSetTimer(Number(call.args.seconds));
          } else if (call.name === 'start_stopwatch' && props.onSetStopwatch) {
            props.onSetStopwatch();
          } else if (call.name === 'start_pomodoro' && props.onSetPomodoro) {
            props.onSetPomodoro();
          }
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Offline Command Parser ready — try typing a time like `10 minutes` or a mode like `kitchen` or `pomodoro`.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickChips = [
    { label: '7m 30s Egg', cmd: '7 minutes 30 seconds' },
    { label: '15m Timer', cmd: '15 minutes' },
    { label: 'Pomodoro', cmd: 'Start Pomodoro focus' },
    { label: 'Kitchen Hub', cmd: 'Open Kitchen' },
  ];

  return (
    <div className="flex flex-col h-[520px] w-full glass rounded-2xl overflow-hidden neo-shadow border border-[#C8A45D]/30">
      <div className="p-4 border-b border-[#C8A45D]/15 flex items-center justify-between bg-[#12100E]/90">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-[#C8A45D]/20 text-[#E5C687]">
            <Terminal size={16} />
          </div>
          <div>
            <span className="font-editorial text-lg text-[#F4F1EA] tracking-wide block leading-none">
              Horological Concierge
            </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#C8A45D]">
              OFFLINE + AI QUICK COMMAND
            </span>
          </div>
        </div>
        <Sparkles size={15} className="text-[#C8A45D]" />
      </div>

      {/* Quick Action Chips */}
      <div className="px-4 py-2.5 border-b border-[#C8A45D]/10 flex flex-wrap gap-1.5 bg-[#0A0908]/60">
        {quickChips.map((chip) => (
          <button
            key={chip.label}
            onClick={() => handleSend(chip.cmd)}
            className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#C8A45D]/10 border border-[#C8A45D]/30 text-[#E5C687] hover:bg-[#C8A45D] hover:text-[#0A0908] transition-colors cursor-pointer"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col max-w-[88%]",
              msg.role === 'user' ? "ml-auto items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "p-3.5 rounded-2xl text-xs leading-relaxed",
                msg.role === 'user'
                  ? "bg-gradient-to-br from-[#C8A45D] to-[#9A7836] text-[#0A0908] font-medium rounded-tr-none"
                  : "bg-[#12100E]/90 border border-[#C8A45D]/20 text-[#F4F1EA] rounded-tl-none"
              )}
            >
              <Markdown>{msg.content}</Markdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-[#C8A45D]">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs font-mono uppercase tracking-widest">Calibrating...</span>
          </div>
        )}
      </div>

      <div className="p-3.5 border-t border-[#C8A45D]/15 bg-[#12100E]/90">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="e.g. '10m timer', 'kitchen', 'pomodoro'..."
            className="w-full bg-[#0A0908] border border-[#C8A45D]/30 rounded-xl py-3 pl-4 pr-11 text-xs text-[#F4F1EA] placeholder-[#8A7348]/70 focus:outline-none focus:border-[#E5C687] transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#C8A45D] text-[#0A0908] disabled:opacity-40 cursor-pointer hover:bg-[#E5C687] transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
