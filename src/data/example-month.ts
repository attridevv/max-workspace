export const month = { label: 'September', year: 2026, days: 30, today: 21 };

export interface Habit { id: string; name: string; done: number[] }

export const habits: Habit[] = [
  { id: 'running', name: 'Running', done: [1, 3, 5, 6, 8, 10, 12, 13, 15, 17, 19, 20, 22, 24, 26, 27, 29] },
  { id: 'strength', name: 'Strength', done: [1, 3, 6, 8, 10, 13, 15, 17, 20, 22, 24, 27, 29] },
  { id: 'mobility', name: 'Mobility', done: [1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 17, 19, 20, 22, 23, 24, 26, 27, 29, 30] },
  { id: 'reading', name: 'Reading', done: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30] },
  { id: 'meditation', name: 'Meditation', done: [2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 20, 21, 22, 23, 25, 26, 27, 28, 30] },
  { id: 'sleep', name: 'Sleep 7h+', done: [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20, 21, 22, 23, 24, 26, 27, 28, 29] },
];

export const highlights: Record<number, string> = {
  1: 'Morning run felt incredible.',
  2: 'Finished project milestone.',
  3: 'Football with friends.',
  4: 'Finally understood recursion.',
  5: 'Beautiful weather today.',
  6: 'Cooked dinner instead of ordering in.',
  7: 'Watched the sunrise from the terrace.',
  8: 'Long call with Ma. Told her about the plan.',
  9: 'New reading streak — nine days.',
  10: 'Rest day. Slept nine hours and needed every one.',
  11: 'Wrote 300 words I actually like.',
  12: 'First tempo run that did not feel like dying.',
  13: 'Cleaned the whole room. Mind feels decluttered.',
  14: 'An old friend called out of nowhere.',
  15: 'Bad day. Still showed up.',
  16: 'Rain. Ran anyway. Best shower of the month.',
  17: 'Ran 8 km before sunrise.',
  18: 'Finished the book I had been carrying for weeks.',
  19: 'Football with friends. Legs sore, mind quiet.',
  20: 'Saved my first ₹5,000 this month.',
  21: 'Finished the first draft of October’s spread.',
  22: 'Dinner with family. Laughed until it hurt.',
  23: 'Personal best in the gym — 100 kg deadlift.',
  24: 'Morning pages. Cleared the fog.',
  25: 'Walked home instead of taking the bus.',
  26: 'Helped a junior debug their code. Teaching is learning.',
  27: 'First 10-mile week since last winter.',
  28: 'Quiet day. Read on the balcony for two hours.',
  29: 'Woke up before the alarm. Rested, not tired.',
  30: 'Closed the month. Goals reviewed, notebook archived.',
};

export const goals = [
  { text: 'Run 80 km', meta: '62.4 / 80 km', pct: 78, done: false },
  { text: 'Finish one book', meta: 'done', pct: 100, done: true },
  { text: 'Complete portfolio redesign', meta: 'in progress', pct: 70, done: false },
  { text: 'Save ₹15,000', meta: '₹11,400 saved', pct: 76, done: false },
];

export const challenge = {
  title: 'No phone during the first 30 minutes after waking.',
  done: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21],
  missed: [7, 15],
  total: 30,
};

export const metrics = [
  { label: 'Sleep', value: '7h 12m avg' },
  { label: 'Distance', value: '62.4 km' },
  { label: 'Reading', value: '214 pages' },
  { label: 'Bodyweight', value: '68.4 kg' },
  { label: 'Resting HR', value: '54 bpm' },
  { label: 'Saved', value: '₹11,400' },
];
