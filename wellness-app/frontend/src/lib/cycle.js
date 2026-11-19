import { todayKey } from "./storage.js";

/* ---------- date helpers (all dates are local "YYYY-MM-DD" strings) ---------- */

export const toDate = (s) => new Date(s + "T00:00:00");

export const fmt = (d) => {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export const addDays = (s, n) => {
  const d = toDate(s);
  d.setDate(d.getDate() + n);
  return fmt(d);
};

export const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);

const avg = (nums) => Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);

/* ---------- cycle maths (uses only the user's own history) ---------- */

const sorted = (periods) => [...periods].sort((a, b) => a.start.localeCompare(b.start));

// Length of each completed cycle = days between consecutive period start dates
export const cycleLengths = (periods) => {
  const list = sorted(periods);
  const out = [];
  for (let i = 1; i < list.length; i++) {
    out.push({
      from: list[i - 1].start,
      to: list[i].start,
      length: daysBetween(list[i - 1].start, list[i].start),
    });
  }
  return out;
};

const validLengths = (periods) =>
  cycleLengths(periods)
    .map((c) => c.length)
    .filter((n) => n >= 15 && n <= 60);

export const avgCycleLength = (periods) => {
  const lens = validLengths(periods).slice(-6);
  return lens.length ? avg(lens) : null;
};

export const avgPeriodLength = (periods) => {
  const durs = periods
    .filter((p) => p.end)
    .map((p) => daysBetween(p.start, p.end) + 1)
    .filter((n) => n >= 1 && n <= 10);
  return durs.length ? avg(durs) : null;
};

export const getSummary = (periods) => {
  const list = sorted(periods);
  if (list.length === 0) return null;

  const last = list[list.length - 1];
  const lens = validLengths(list);
  const avgLen = avgCycleLength(list);
  const len = avgLen || 28; // default when we don't have enough data yet
  const periodLen = avgPeriodLength(list) || 5;
  const irregular = lens.length >= 2 && Math.max(...lens) - Math.min(...lens) > 7;

  return {
    lastStart: last.start,
    avgLen, // null until at least 2 periods are recorded
    len,
    periodLen,
    nextStart: addDays(last.start, len),
    irregular,
    cyclesRecorded: lens.length,
  };
};

// Which phase of the cycle is "today" (an estimate)
export const getPhase = (periods, today = todayKey()) => {
  const s = getSummary(periods);
  if (!s) return null;

  const diff = daysBetween(s.lastStart, today);
  if (diff < 0) return null;

  const day = diff + 1;
  const ovulation = s.len - 14;
  let key = "luteal";
  if (day <= s.periodLen) key = "menstrual";
  else if (day < ovulation - 1) key = "follicular";
  else if (day <= ovulation + 1) key = "ovulation";

  return {
    key,
    day,
    len: s.len,
    daysToNext: s.len - diff, // 0 or negative means due / a little late
    overdueBy: Math.max(0, diff - s.len),
  };
};

// Set of estimated future period dates (next two cycles)
export const predictedDates = (periods, today = todayKey()) => {
  const s = getSummary(periods);
  const set = new Set();
  if (!s) return set;
  for (let k = 1; k <= 2; k++) {
    const start = addDays(s.lastStart, s.len * k);
    for (let i = 0; i < s.periodLen; i++) {
      const d = addDays(start, i);
      if (d >= today) set.add(d);
    }
  }
  return set;
};