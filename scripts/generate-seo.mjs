import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://stopwatchplus.com';
const LASTMOD = '2026-11-04';

export const seoRoutes = [
  // Core Instrument Routes
  {
    path: '/stopwatch',
    tab: 'stopwatch',
    label: 'Pro Telemetry Chronograph',
    title: 'Online Stopwatch with Millisecond Laps & Pace Telemetry | Stopwatch+',
    description: 'Free zero-drift online stopwatch with millisecond precision, fastest/slowest lap telemetry, pace delta analytics, and CSV export.',
    priority: '0.95',
  },
  {
    path: '/timer',
    tab: 'timer',
    label: 'Countdown Timer',
    title: 'Online Countdown Timer — Multi-Timer & Custom Alarms | Stopwatch+',
    description: 'Set custom online countdown timers from 1 second to 99 hours with simultaneous multi-timer queues, overtime count-up mode, and horological chimes.',
    priority: '0.95',
  },
  {
    path: '/pomodoro-timer',
    tab: 'pomodoro',
    label: 'Pomodoro Focus Studio',
    title: 'Pomodoro Timer Online — Deep Work Tracker & Brown Noise | Stopwatch+',
    description: 'Boost productivity with our luxury Pomodoro focus timer featuring an interactive task ledger and built-in Brown Noise, Pink Rain & 40Hz Gamma drone.',
    priority: '0.95',
  },
  {
    path: '/kitchen-timer',
    tab: 'kitchen',
    label: 'Culinary Command Center',
    title: 'Online Kitchen Timer — Multi-Stage Steak, Egg, Coffee & Tea Lab | Stopwatch+',
    description: 'Precision culinary timers with mid-cook flip alerts for cast-iron steak, soft-boiled eggs, pour-over coffee bloom, and artisan tea steeping.',
    priority: '0.90',
  },
  {
    path: '/random-tools',
    tab: 'random',
    label: 'Stochastic Decision Suite',
    title: 'Random Decision Tools — Wheel Spinner, Dice Roller & Coin Flip | Stopwatch+',
    description: 'Cryptographically fair random decision tools: interactive wheel of fortune, 3D coin flip, polyhedral RPG dice roller, and team generator.',
    priority: '0.88',
  },
  {
    path: '/wheel-spinner',
    tab: 'random',
    label: 'Wheel of Fortune Spinner',
    title: 'Random Name Wheel Spinner — Elimination Mode & Confetti | Stopwatch+',
    description: 'Spin the luxury golden wheel of names with physics inertia, elimination mode, and instant winner celebration.',
    priority: '0.88',
  },
  {
    path: '/dice-roller',
    tab: 'random',
    label: 'Polyhedral Dice Roller',
    title: 'Online Dice Roller — D4, D6, D8, D10, D12, D20 & D100 | Stopwatch+',
    description: 'Roll up to 10 polyhedral dice simultaneously with instant sum telemetry and roll history for tabletop gaming and classrooms.',
    priority: '0.85',
  },
  {
    path: '/coin-flip',
    tab: 'random',
    label: 'Sovereign Coin Flip',
    title: 'Flip a Coin Online — Fair Heads or Tails Streaker | Stopwatch+',
    description: 'Instant 3D gold sovereign coin toss with live heads-vs-tails ratio and streak statistics.',
    priority: '0.85',
  },
  {
    path: '/interval-timer',
    tab: 'stopwatch',
    seconds: 1200,
    label: 'HIIT Interval Timer',
    title: 'Online Interval Timer — Custom Work, Rest & Round Synthesizer | Stopwatch+',
    description: 'Programmable HIIT and circuit interval timer with warmup, high-intensity work, active recovery, cooldown, and acoustic round cues.',
    priority: '0.90',
  },
  {
    path: '/chess-clock',
    tab: 'stopwatch',
    label: 'Fischer Chess Clock',
    title: 'Online Chess Clock — Fischer Increment & Bullet/Blitz Presets | Stopwatch+',
    description: 'Dual-player tournament chess clock with +1s/+2s/+3s/+5s/+10s Fischer increments, move counters, and Spacebar/Tap switching.',
    priority: '0.86',
  },

  // High-Volume Countdown Presets
  {
    path: '/30-second-timer',
    tab: 'timer',
    seconds: 30,
    label: '30 Second Timer',
    title: '30 Second Timer — Instant Online Countdown with Alarm | Stopwatch+',
    description: 'Start a precision 30-second countdown timer with one click. Ideal for sprints, planks, stretching, and quick drills.',
    priority: '0.85',
  },
  {
    path: '/45-second-timer',
    tab: 'timer',
    seconds: 45,
    label: '45 Second Timer',
    title: '45 Second Timer — Online Workout & Pour-Over Bloom Timer | Stopwatch+',
    description: 'Accurate 45-second online timer with visual progress bar and acoustic chime for HIIT sets and coffee blooming.',
    priority: '0.85',
  },
  {
    path: '/1-minute-timer',
    tab: 'timer',
    seconds: 60,
    label: '1 Minute Timer',
    title: '1 Minute Timer (60 Seconds) — Online Countdown with Alarm | Stopwatch+',
    description: 'Set a 1-minute (60-second) countdown timer with zero time drift, fullscreen projector mode, and custom acoustic chimes.',
    priority: '0.92',
  },
  {
    path: '/2-minute-timer',
    tab: 'timer',
    seconds: 120,
    label: '2 Minute Timer',
    title: '2 Minute Timer — Instant Online Countdown & Chime | Stopwatch+',
    description: 'Clean, distraction-free 2-minute (120-second) online timer with fullscreen display and gentle singing bowl or beep alarms.',
    priority: '0.90',
  },
  {
    path: '/3-minute-timer',
    tab: 'timer',
    seconds: 180,
    label: '3 Minute Timer',
    title: '3 Minute Timer — Online Countdown for Tea, Boxing & Speeches | Stopwatch+',
    description: 'Precision 3-minute countdown timer with live browser tab countdown, fullscreen cinema mode, and custom chimes.',
    priority: '0.90',
  },
  {
    path: '/4-minute-timer',
    tab: 'timer',
    seconds: 240,
    label: '4 Minute Timer',
    title: '4 Minute Timer — French Press & Tabata Countdown | Stopwatch+',
    description: 'Start an exact 4-minute countdown timer online for French Press coffee extraction, Tabata workouts, and timed drills.',
    priority: '0.86',
  },
  {
    path: '/5-minute-timer',
    tab: 'timer',
    seconds: 300,
    label: '5 Minute Timer',
    title: '5 Minute Timer — Online Countdown with Fullscreen & Alarm | Stopwatch+',
    description: 'Free 5-minute online countdown timer with zero-drift accuracy, overtime count-up mode, and soothing horological chimes.',
    priority: '0.94',
  },
  {
    path: '/7-minute-timer',
    tab: 'timer',
    seconds: 420,
    label: '7 Minute Timer',
    title: '7 Minute Timer — Jammy Egg & 7-Minute Workout Countdown | Stopwatch+',
    description: 'Precision 7-minute timer for jammy ramen eggs, 7-minute scientific workouts, and lightning presentations.',
    priority: '0.86',
  },
  {
    path: '/10-minute-timer',
    tab: 'timer',
    seconds: 600,
    label: '10 Minute Timer',
    title: '10 Minute Timer — Online Countdown for Study, Breaks & Cooking | Stopwatch+',
    description: 'Start a 10-minute countdown timer with live browser tab updates, fullscreen mode, and custom alarm profiles.',
    priority: '0.94',
  },
  {
    path: '/12-minute-timer',
    tab: 'timer',
    seconds: 720,
    label: '12 Minute Timer',
    title: '12 Minute Timer — Cooper Test & Culinary Countdown | Stopwatch+',
    description: 'Exact 12-minute online countdown timer for Cooper fitness runs, hard-boiled eggs, and baking intervals.',
    priority: '0.85',
  },
  {
    path: '/15-minute-timer',
    tab: 'timer',
    seconds: 900,
    label: '15 Minute Timer',
    title: '15 Minute Timer — Online Quarter-Hour Countdown & Chime | Stopwatch+',
    description: 'Set a 15-minute countdown timer with one click. Features fullscreen classroom/gym display and desktop notifications.',
    priority: '0.92',
  },
  {
    path: '/20-minute-timer',
    tab: 'timer',
    seconds: 1200,
    label: '20 Minute Timer',
    title: '20 Minute Timer — Power Nap, Focus & Workout Countdown | Stopwatch+',
    description: 'Distraction-free 20-minute online countdown timer for power naps, deep work sprints, and AMRAP workouts.',
    priority: '0.92',
  },
  {
    path: '/25-minute-timer',
    tab: 'timer',
    seconds: 1500,
    label: '25 Minute Pomodoro Timer',
    title: '25 Minute Timer — Classic Pomodoro Focus Sprint | Stopwatch+',
    description: 'Start a 25-minute Pomodoro focus countdown timer with zero-drift precision and calming acoustic notifications.',
    priority: '0.92',
  },
  {
    path: '/30-minute-timer',
    tab: 'timer',
    seconds: 1800,
    label: '30 Minute Timer',
    title: '30 Minute Timer — Half-Hour Online Countdown with Alarm | Stopwatch+',
    description: 'Accurate 30-minute (half-hour) online countdown timer with live tab progress and customizable chimes.',
    priority: '0.94',
  },
  {
    path: '/40-minute-timer',
    tab: 'timer',
    seconds: 2400,
    label: '40 Minute Timer',
    title: '40 Minute Timer — Lecture, Exam & Baking Countdown | Stopwatch+',
    description: 'Reliable 40-minute online countdown timer with fullscreen projector mode for exams, workshops, and roasting.',
    priority: '0.86',
  },
  {
    path: '/45-minute-timer',
    tab: 'timer',
    seconds: 2700,
    label: '45 Minute Timer',
    title: '45 Minute Timer — Deep Work & Classroom Countdown | Stopwatch+',
    description: 'Set a 45-minute countdown timer online with overtime tracking and desktop completion alerts.',
    priority: '0.90',
  },
  {
    path: '/50-minute-timer',
    tab: 'timer',
    seconds: 3000,
    label: '50 Minute Timer',
    title: '50 Minute Timer — 50/10 Ultradian Focus Block | Stopwatch+',
    description: '50-minute countdown timer designed for 50/10 ultradian deep work sessions and university lectures.',
    priority: '0.88',
  },
  {
    path: '/60-minute-timer',
    tab: 'timer',
    seconds: 3600,
    label: '60 Minute (1 Hour) Timer',
    title: '60 Minute Timer (1 Hour) — Online Countdown with Alarm | Stopwatch+',
    description: 'Start a 60-minute (1-hour) countdown timer online. Zero background tab drift, fullscreen mode, and custom chimes.',
    priority: '0.94',
  },
  {
    path: '/90-minute-timer',
    tab: 'timer',
    seconds: 5400,
    label: '90 Minute Ultradian Timer',
    title: '90 Minute Timer — Ultradian Deep Work & Exam Countdown | Stopwatch+',
    description: '90-minute countdown timer for full ultradian productivity cycles, mock exams, and feature-length practice.',
    priority: '0.90',
  },
  {
    path: '/2-hour-timer',
    tab: 'timer',
    seconds: 7200,
    label: '2 Hour Timer',
    title: '2 Hour Timer (120 Minutes) — Long Exam & Slow-Cook Countdown | Stopwatch+',
    description: 'Precision 2-hour (120-minute) online timer with hardware clock synchronization so it never loses a second.',
    priority: '0.86',
  },

  // Culinary, Wellness & Fitness Presets
  {
    path: '/soft-boiled-egg-timer',
    tab: 'timer',
    seconds: 360,
    label: 'Soft Boiled Egg (Runny Yolk)',
    title: 'Soft Boiled Egg Timer (6 Minutes) — Perfect Runny Yolk | Stopwatch+',
    description: 'Foolproof 6-minute soft-boiled egg timer with fridge vs. room temperature adjustments in our Culinary Command Center.',
    priority: '0.90',
  },
  {
    path: '/jammy-egg-timer',
    tab: 'timer',
    seconds: 420,
    label: 'Jammy Ramen Egg Timer',
    title: 'Jammy Egg Timer (7 Minutes) — Custard Ramen Eggs | Stopwatch+',
    description: 'Exact 7-minute jammy egg countdown timer for velvety custard-yolk ramen and salad eggs.',
    priority: '0.88',
  },
  {
    path: '/hard-boiled-egg-timer',
    tab: 'timer',
    seconds: 660,
    label: 'Hard Boiled Egg Timer',
    title: 'Hard Boiled Egg Timer (11 Minutes) — No Green Ring | Stopwatch+',
    description: 'Precision 11-minute hard-boiled egg timer with ice-bath prompt for tender whites and bright golden yolks.',
    priority: '0.90',
  },
  {
    path: '/poached-egg-timer',
    tab: 'timer',
    seconds: 210,
    label: 'Poached Egg Timer',
    title: 'Poached Egg Timer (3.5 Minutes) — Eggs Benedict Precision | Stopwatch+',
    description: 'Exact 3-minute 30-second poached egg countdown for restaurant-grade Eggs Benedict.',
    priority: '0.85',
  },
  {
    path: '/steak-sear-timer',
    tab: 'kitchen',
    seconds: 240,
    label: 'Cast Iron Steak Sear & Flip Timer',
    title: 'Steak Sear Timer — Thickness Calculator, Flip Alert & Rest Timer | Stopwatch+',
    description: 'Interactive steak cooking timer by cut thickness (0.75" to 2.0") and doneness with mid-cook FLIP NOW alerts and 5-minute rest timer.',
    priority: '0.90',
  },
  {
    path: '/air-fryer-timer',
    tab: 'timer',
    seconds: 720,
    label: 'Air Fryer Crisp & Shake Timer',
    title: 'Air Fryer Timer — Mid-Cook Basket Shake Alert & Countdown | Stopwatch+',
    description: 'Online air fryer timer with halfway shake prompts for evenly crisped wings, fries, salmon, and vegetables.',
    priority: '0.88',
  },
  {
    path: '/pour-over-coffee-timer',
    tab: 'kitchen',
    seconds: 180,
    label: 'Pour-Over V60 / Chemex Bloom Timer',
    title: 'Pour-Over Coffee Timer — 45s Bloom & Staged Pour Cadence | Stopwatch+',
    description: 'Barista pour-over coffee timer with a 45-second CO2 bloom phase and staged spiral pour prompts for V60 and Chemex.',
    priority: '0.88',
  },
  {
    path: '/french-press-timer',
    tab: 'kitchen',
    seconds: 240,
    label: 'French Press Immersion Timer',
    title: 'French Press Coffee Timer (4 Minutes) — Crust Break & Plunge | Stopwatch+',
    description: 'Exact 4-minute French press immersion timer with crust-break stir alert and gentle plunge cue.',
    priority: '0.88',
  },
  {
    path: '/aeropress-timer',
    tab: 'timer',
    seconds: 120,
    label: 'AeroPress Brew & Press Timer',
    title: 'AeroPress Timer (2 Minutes) — Steep, Swirl & Press | Stopwatch+',
    description: '2-minute AeroPress brewing timer for clean, sweet espresso-style or filter coffee extractions.',
    priority: '0.85',
  },
  {
    path: '/tea-steep-timer',
    tab: 'kitchen',
    seconds: 180,
    label: 'Artisan Tea Steep Timer',
    title: 'Tea Steep Timer — Green, Black, Oolong, White & Herbal | Stopwatch+',
    description: 'Precision tea infusion timer with exact water temperature guides (80°C–100°C) to prevent tannic bitterness.',
    priority: '0.88',
  },
  {
    path: '/pizza-oven-timer',
    tab: 'timer',
    seconds: 480,
    label: 'Artisan Pizza Bake Timer',
    title: 'Pizza Oven Timer — Neapolitan, NY Style & Cast Iron Pan | Stopwatch+',
    description: 'High-heat pizza bake timer with 180-degree rotation alerts for blistered, leopard-spotted crust.',
    priority: '0.85',
  },
  {
    path: '/sourdough-proof-timer',
    tab: 'timer',
    seconds: 1800,
    label: 'Sourdough Stretch & Fold Timer',
    title: 'Sourdough Stretch & Fold Timer (30 Minutes) — Bulk Fermentation | Stopwatch+',
    description: '30-minute coil-fold and stretch-and-fold interval timer for artisan sourdough bread baking.',
    priority: '0.85',
  },
  {
    path: '/pasta-al-dente-timer',
    tab: 'kitchen',
    seconds: 540,
    label: 'Pasta Al Dente Timer',
    title: 'Pasta Al Dente Timer — Spaghetti, Penne, Rigatoni & Fresh Pasta | Stopwatch+',
    description: 'Exact al dente pasta boil timer with 1-minute-early taste-test alert and pasta-water reserve reminder.',
    priority: '0.86',
  },
  {
    path: '/tabata-timer',
    tab: 'stopwatch',
    seconds: 240,
    label: 'Tabata 20s/10s Protocol',
    title: 'Tabata Timer Online — 20s Work / 10s Rest × 8 Rounds | Stopwatch+',
    description: 'Authentic 4-minute Tabata protocol timer (20 seconds work, 10 seconds rest for 8 rounds) with audio phase transitions.',
    priority: '0.92',
  },
  {
    path: '/hiit-timer',
    tab: 'stopwatch',
    seconds: 900,
    label: 'HIIT Circuit Synthesizer',
    title: 'HIIT Timer Online — High-Intensity Interval Workout Clock | Stopwatch+',
    description: 'Customizable HIIT workout clock with warmup, high-output work intervals, recovery periods, and fullscreen gym view.',
    priority: '0.92',
  },
  {
    path: '/emom-timer',
    tab: 'timer',
    seconds: 60,
    label: 'EMOM (Every Minute on the Minute)',
    title: 'EMOM Timer Online — Every Minute on the Minute CrossFit Clock | Stopwatch+',
    description: 'Precision 60-second EMOM interval timer for CrossFit, kettlebell complexes, and conditioning circuits.',
    priority: '0.86',
  },
  {
    path: '/box-breathing-timer',
    tab: 'timer',
    seconds: 300,
    label: 'Box Breathing (4-4-4-4 Cadence)',
    title: 'Box Breathing Timer — 4-4-4-4 Navy SEAL Calm & Focus | Stopwatch+',
    description: '5-minute guided box breathing timer (4s inhale, 4s hold, 4s exhale, 4s hold) with ambient pink rain & singing bowls.',
    priority: '0.90',
  },
  {
    path: '/4-7-8-breathing-timer',
    tab: 'timer',
    seconds: 240,
    label: '4-7-8 Parasympathetic Breath Timer',
    title: '4-7-8 Breathing Timer — Deep Relaxation & Sleep Reset | Stopwatch+',
    description: '4-minute parasympathetic breathing timer with soothing Tibetan singing bowl chimes.',
    priority: '0.85',
  },
  {
    path: '/study-timer',
    tab: 'pomodoro',
    seconds: 1500,
    label: 'Study & Exam Focus Timer',
    title: 'Online Study Timer — Pomodoro Tasks + 40Hz Gamma & Brown Noise | Stopwatch+',
    description: 'Distraction-free online study timer with session streak tracking, task estimates, and procedural 40Hz Gamma focus audio.',
    priority: '0.92',
  },
  {
    path: '/meditation-timer',
    tab: 'timer',
    seconds: 600,
    label: 'Mindfulness Meditation Timer',
    title: 'Meditation Timer Online — Tibetan Singing Bowl & Ambient Rain | Stopwatch+',
    description: 'Peaceful 10-minute mindfulness meditation timer with authentic synthesized Tibetan singing bowl harmonics.',
    priority: '0.88',
  },
  {
    path: '/plank-timer',
    tab: 'timer',
    seconds: 120,
    label: 'Core Plank Hold Timer',
    title: 'Plank Timer Online — Core Endurance Countdown & Stopwatch | Stopwatch+',
    description: 'Track your core plank hold with centisecond precision or set a 2-minute countdown target.',
    priority: '0.85',
  },
  {
    path: '/classroom-timer',
    tab: 'timer',
    seconds: 600,
    label: 'Fullscreen Classroom Projector Timer',
    title: 'Classroom Timer — Giant Fullscreen Projector Countdown for Teachers | Stopwatch+',
    description: 'Ultra-clean fullscreen projector timer (press F) with gentle chimes and random student wheel picker for classrooms.',
    priority: '0.88',
  },
  {
    path: '/presentation-timer',
    tab: 'timer',
    seconds: 900,
    label: 'Keynote Speaker & Overtime Timer',
    title: 'Presentation Timer — Speaker Countdown with Overtime Count-Up | Stopwatch+',
    description: 'Stage-ready keynote speaker timer that automatically counts UP in crimson overtime when time expires.',
    priority: '0.88',
  },
];

// 1. Write src/seoRoutes.ts
const tsContent = `import { TimerType } from './types';

export interface SeoRouteConfig {
  path: string;
  tab: TimerType;
  seconds?: number;
  label: string;
  title: string;
  description: string;
  priority: string;
}

export const SEO_ROUTES: SeoRouteConfig[] = ${JSON.stringify(seoRoutes, null, 2)};

export function findSeoRoute(pathname: string): SeoRouteConfig | undefined {
  const normalized = pathname.replace(/\\/+$/, '') || '/';
  return SEO_ROUTES.find((r) => r.path === normalized);
}
`;

fs.writeFileSync(path.resolve('src/seoRoutes.ts'), tsContent, 'utf8');

// 2. Write public/sitemap.xml (Root + 53 SEO URLs = 54 URLs)
const urlEntries = [
  `  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.00</priority>
  </url>`,
  ...seoRoutes.map(
    (r) => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  ),
].join('\n');

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

fs.writeFileSync(path.resolve('public/sitemap.xml'), sitemapXml, 'utf8');

// 3. Write public/robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
fs.writeFileSync(path.resolve('public/robots.txt'), robotsTxt, 'utf8');

// 4. Write public/_redirects for Netlify SPA routing
const redirectsTxt = `/*    /index.html   200\n`;
fs.writeFileSync(path.resolve('public/_redirects'), redirectsTxt, 'utf8');

// 5. Write public/manifest.json for PWA installability
const manifestJson = {
  name: 'Stopwatch+ | Precision Timekeeping & Horology Suite',
  short_name: 'Stopwatch+',
  description:
    'Zero-drift millisecond stopwatch, multi-timer countdowns, Pomodoro focus studio with procedural audio, and culinary command center.',
  start_url: '/',
  display: 'standalone',
  background_color: '#0A0908',
  theme_color: '#C8A45D',
  icons: [
    {
      src: '/emblem.jpg',
      sizes: '512x512',
      type: 'image/jpeg',
      purpose: 'any maskable',
    },
  ],
};
fs.writeFileSync(path.resolve('public/manifest.json'), JSON.stringify(manifestJson, null, 2), 'utf8');

console.log(`Generated src/seoRoutes.ts, public/sitemap.xml (${seoRoutes.length + 1} URLs), public/robots.txt, public/_redirects, and public/manifest.json`);
