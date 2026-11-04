export type TimerType = 'stopwatch' | 'timer' | 'pomodoro' | 'kitchen' | 'random' | 'privacy' | 'terms';

export interface Lap {
  id: string;
  time: number;
  overallTime: number;
}

export interface TimerPreset {
  label: string;
  seconds: number;
}
