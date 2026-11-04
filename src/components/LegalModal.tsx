import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'about';
  onClose: () => void;
}

export default function LegalModal({ type, onClose }: LegalModalProps) {
  const content = type === 'privacy' ? {
    title: 'Privacy Charter',
    sections: [
      {
        title: 'Local-First Sovereignty',
        text: 'Stopwatch. is engineered as a privacy-first horological instrument. All chronograph splits, countdown intervals, focus sessions, and culinary timers are persisted locally in your browser via localStorage and never transmitted to external servers.'
      },
      {
        title: 'Quick Command & Concierge',
        text: 'Our built-in Quick Command parser processes timekeeping instructions directly on your device with zero network latency. When an optional Gemini API key is configured, conversational prompts are processed securely.'
      },
      {
        title: 'Zero Telemetry',
        text: 'We do not sell, broker, or profile personal timekeeping habits.'
      }
    ]
  } : type === 'terms' ? {
    title: 'Terms of Atelier Service',
    sections: [
      {
        title: 'Acceptance of Charter',
        text: 'By operating the Stopwatch. Precision Timekeeping Suite, you agree to these terms of use.'
      },
      {
        title: 'Horological Precision',
        text: 'While Stopwatch. utilizes high-resolution system timestamps for centisecond accuracy, browser background throttling may affect unpinned tabs.'
      }
    ]
  } : {
    title: 'About the Stopwatch. Atelier',
    sections: [
      {
        title: 'Haute Horlogerie Philosophy',
        text: 'Stopwatch. merges the timeless craft of celestial astrolabes and mechanical chronographs with modern digital precision.'
      },
      {
        title: 'Suite Capabilities',
        text: 'Includes a centisecond Split Chronograph, Calibrated Countdown Reservoir, Cognitive Pomodoro Cadence, Multi-Channel Culinary Hub, and Stochastic Fortune Instruments.'
      }
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A0908]/85 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.94, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 15 }}
        className="w-full max-w-2xl glass rounded-2xl neo-shadow border border-[#C8A45D]/30 overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-[#C8A45D]/15 flex items-center justify-between bg-[#12100E]">
          <div className="flex items-center space-x-2.5">
            <span className="text-[#C8A45D]">◆</span>
            <h2 className="font-editorial text-2xl text-[#F4F1EA]">{content.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#9E9587] hover:text-[#E5C687] hover:bg-[#C8A45D]/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {content.sections.map((section, i) => (
            <div key={i} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A45D]">
                {section.title}
              </h3>
              <p className="text-sm text-[#9E9587] leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
