// Temporary mock storage (browser only). Replaced by FastAPI + MySQL later.
const ACCOUNT_KEY = "bloom_account";
const SESSION_KEY = "bloom_session";
const TOKEN_KEY = "bloom_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};
const PROFILE_KEY = "bloom_profile";
const LOGS_KEY = "bloom_logs";
const CYCLE_KEY = "bloom_cycle"; // old format, only read for migration
const PERIODS_KEY = "bloom_periods";
const SYMPTOMS_KEY = "bloom_symptoms";
const MEALS_KEY = "bloom_meals";
const DISMISSED_KEY = "bloom_dismissed";

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

/* ---------- account & session ---------- */

export const getAccount = () => read(ACCOUNT_KEY);
export const saveAccount = (account) =>
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
export const updateAccount = (patch) => {
  const next = { ...(getAccount() || {}), ...patch };
  saveAccount(next);
  return next;
};

export const getSession = () => localStorage.getItem(SESSION_KEY);
export const setSession = (email) => localStorage.setItem(SESSION_KEY, email);
export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

/* ---------- profile ---------- */

export const getProfile = () => read(PROFILE_KEY);
export const saveProfile = (profile) =>
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
export const updateProfile = (patch) => {
  const next = { ...(getProfile() || {}), ...patch };
  saveProfile(next);
  return next;
};

// Sensible starting goals based on age range, so nobody has to set goals up front.
// These can be edited later in Settings.
export const getDefaultGoals = (ageRange) => {
  if (ageRange === "13–17") return { sleep: 9, water: 8, activity: 60 };
  return { sleep: 8, water: 8, activity: 30 };
};

/* ---------- dates ---------- */

// Local date as YYYY-MM-DD (not UTC, so "today" matches the user's day)
export const todayKey = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

/* ---------- daily logs (water, sleep, activity, mood, energy) ---------- */
// Stored as { "YYYY-MM-DD": { water, sleep, activity, mood, energy } }
// mood: "happy" | "calm" | "neutral" | "sad" | "frustrated" | null
// energy: "low" | "moderate" | "high" | null

const emptyLog = () => ({ water: 0, sleep: 0, activity: 0, mood: null, energy: null, stress: null });

export const getLogs = () => read(LOGS_KEY) || {};

export const getTodayLog = () => ({ ...emptyLog(), ...(getLogs()[todayKey()] || {}) });

// Used by the dashboard. Returns just today's log.
export const updateTodayLog = (patch) => {
  const logs = getLogs();
  const updated = { ...emptyLog(), ...(logs[todayKey()] || {}), ...patch };
  logs[todayKey()] = updated;
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  return updated;
};

// Used by the Track page. Works on any date and returns ALL logs.
export const updateLog = (date, patch) => {
  const logs = getLogs();
  logs[date] = { ...emptyLog(), ...(logs[date] || {}), ...patch };
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  return logs;
};

export const deleteLog = (date) => {
  const logs = getLogs();
  delete logs[date];
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  return logs;
};

/* ---------- periods ---------- */
// A period looks like: { id, start: "YYYY-MM-DD", end: "YYYY-MM-DD" | null }

const sortPeriods = (list) => [...list].sort((a, b) => a.start.localeCompare(b.start));

const savePeriods = (list) => {
  const sortedList = sortPeriods(list);
  localStorage.setItem(PERIODS_KEY, JSON.stringify(sortedList));
  return sortedList;
};

export const getPeriods = () => {
  const stored = read(PERIODS_KEY);
  if (stored) return sortPeriods(stored);

  // Migrate from the older single-date format if present
  const old = read(CYCLE_KEY);
  if (old?.lastStart) {
    return savePeriods([{ id: `p-${old.lastStart}`, start: old.lastStart, end: null }]);
  }
  return [];
};

export const addPeriod = (start, end = null) => {
  const list = getPeriods();
  if (list.some((p) => p.start === start)) return list;
  const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return savePeriods([...list, { id, start, end }]);
};

export const updatePeriod = (id, patch) =>
  savePeriods(getPeriods().map((p) => (p.id === id ? { ...p, ...patch } : p)));

export const deletePeriod = (id) => savePeriods(getPeriods().filter((p) => p.id !== id));

/* ---------- symptoms ---------- */
// Stored as { "YYYY-MM-DD": { cramps: 2, headache: 1 } } where the number is severity 1-3

export const getSymptoms = () => read(SYMPTOMS_KEY) || {};

export const setSymptomsForDate = (date, symptoms) => {
  const all = getSymptoms();
  if (Object.keys(symptoms).length === 0) delete all[date];
  else all[date] = symptoms;
  localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(all));
  return all;
};

/* ---------- meals ---------- */

export const MEAL_TYPES = ["breakfast", "lunch", "snacks", "dinner"];

const emptyDay = () => ({
  breakfast: [],
  lunch: [],
  snacks: [],
  dinner: [],
  skipped: {},
});

export const getAllMeals = () => read(MEALS_KEY) || {};

export const getMeals = (date = todayKey()) => {
  const saved = getAllMeals()[date];
  const day = { ...emptyDay(), ...(saved && typeof saved === "object" ? saved : {}) };
  // Guard against damaged saved data: each meal must be a list of valid entries
  for (const m of MEAL_TYPES) {
    day[m] = Array.isArray(day[m]) ? day[m].filter((e) => e && e.foodId) : [];
  }
  return day;
};

const saveDay = (date, day) => {
  const all = getAllMeals();
  all[date] = day;
  localStorage.setItem(MEALS_KEY, JSON.stringify(all));
  return day;
};

export const addMealEntry = (meal, foodId, servings, date = todayKey()) => {
  const day = getMeals(date);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    foodId,
    servings,
  };
  day[meal] = [...day[meal], entry];
  day.skipped = { ...day.skipped, [meal]: false };
  return saveDay(date, day);
};

export const removeMealEntry = (meal, entryId, date = todayKey()) => {
  const day = getMeals(date);
  day[meal] = day[meal].filter((e) => e.id !== entryId);
  return saveDay(date, day);
};

export const setMealSkipped = (meal, skipped, date = todayKey()) => {
  const day = getMeals(date);
  day.skipped = { ...day.skipped, [meal]: skipped };
  return saveDay(date, day);
};

// Most recently logged distinct foods (for quick re-logging)
export const getRecentFoodIds = (limit = 8) => {
  const all = getAllMeals();
  const dates = Object.keys(all).sort().reverse();
  const ids = [];
  for (const d of dates) {
    for (const m of MEAL_TYPES) {
      const entries = [...(all[d][m] || [])].reverse();
      for (const e of entries) {
        if (!ids.includes(e.foodId)) ids.push(e.foodId);
        if (ids.length >= limit) return ids;
      }
    }
  }
  return ids;
};

/* ---------- dismissed insight suggestions ---------- */
// Stored as { suggestionId: "YYYY-MM-DD" } (hidden for 7 days)

export const getDismissed = () => read(DISMISSED_KEY) || {};

export const dismissInsight = (id) => {
  const all = getDismissed();
  all[id] = todayKey();
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(all));
  return all;
};

export const clearDismissed = () => {
  localStorage.removeItem(DISMISSED_KEY);
  return {};
};

/* ---------- your data: export & delete ---------- */

const bloomKeys = () => Object.keys(localStorage).filter((k) => k.startsWith("bloom_"));

// Everything the user entered (never includes the PIN or session)
export const exportAllData = () => {
  const out = { exportedOn: todayKey() };
  bloomKeys()
    .filter((k) => k !== "bloom_pin" && k !== SESSION_KEY)
    .forEach((k) => {
      out[k.replace("bloom_", "")] = read(k);
    });
  return out;
};

// Removes entries but keeps the account, profile and settings
export const deleteTrackedData = () => {
  [LOGS_KEY, PERIODS_KEY, SYMPTOMS_KEY, MEALS_KEY, CYCLE_KEY, DISMISSED_KEY].forEach((k) =>
    localStorage.removeItem(k)
  );
};

// Removes everything, including the account and PIN
export const deleteEverything = () => {
  bloomKeys().forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem("bloom_unlocked");
  sessionStorage.removeItem("bloom_reset_pin");
};