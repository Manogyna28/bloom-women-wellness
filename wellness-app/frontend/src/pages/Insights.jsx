import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Moon,
  Droplets,
  Footprints,
  Apple,
  Smile,
  CalendarHeart,
  Droplet,
  X,
  Check,
  Printer,
  ShieldCheck,
  FileHeart,
  Heart,
  Info,
} from "lucide-react";
import { foods, foodById, dietAllowed } from "../data/foods.js";
import { phases } from "../data/phases.js";
import {
  MEAL_TYPES,
  getAccount,
  getProfile,
  getDefaultGoals,
  getLogs,
  getAllMeals,
  getPeriods,
  getSymptoms,
  getDismissed,
  dismissInsight,
  clearDismissed,
  todayKey,
} from "../lib/storage.js";
import {
  addDays,
  daysBetween,
  toDate,
  cycleLengths,
  getSummary,
  getPhase,
  avgPeriodLength,
} from "../lib/cycle.js";

/* ---------- constants & helpers ---------- */

const moods = {
  happy: "😊",
  calm: "😌",
  neutral: "😐",
  sad: "😢",
  frustrated: "😣",
};

const symptomLabels = {
  cramps: "Cramps",
  headache: "Headache",
  fatigue: "Fatigue",
  bloating: "Bloating",
  backpain: "Back pain",
  moodswings: "Mood swings",
  tender: "Tender breasts",
  nausea: "Nausea",
  acne: "Acne",
  cravings: "Cravings",
};

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const round1 = (n) => Math.round(n * 10) / 10;

const shortDate = (s) =>
  toDate(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const foodStats = (dates, meals) => {
  let foodDays = 0;
  let skipped = 0;
  let iron = 0;
  dates.forEach((d) => {
    const day = meals[d];
    if (!day) return;
    const entries = MEAL_TYPES.flatMap((m) => day[m] || []);
    if (entries.length) {
      foodDays += 1;
      iron += entries.reduce((s, e) => s + (foodById[e.foodId]?.iron || 0) * e.servings, 0);
    }
    skipped += MEAL_TYPES.filter((m) => day.skipped?.[m] && !(day[m] || []).length).length;
  });
  return { foodDays, skipped, avgIron: foodDays ? iron / foodDays : 0 };
};

/* ---------- page ---------- */

export default function Insights() {
  const account = getAccount();
  const profile = getProfile() || {};
  const goals = profile.goals || getDefaultGoals(account?.age);
  const allergies = profile.allergies || [];

  const [dismissed, setDismissed] = useState(getDismissed());
  const [include, setInclude] = useState({
    cycle: true,
    symptoms: true,
    lifestyle: true,
    food: false,
    name: false,
  });

  const today = todayKey();

  const data = useMemo(() => {
    const logs = getLogs();
    const meals = getAllMeals();
    const periods = getPeriods();
    const symptoms = getSymptoms();

    const last = (n) => Array.from({ length: n }, (_, i) => addDays(today, -(n - 1 - i)));
    const week = last(7);
    const month = last(30);
    const L = (d) => logs[d] || {};

    // ----- week lifestyle -----
    const sleepDays = week.filter((d) => L(d).sleep > 0);
    const waterDays = week.filter((d) => L(d).water > 0);
    const activeDays = week.filter((d) => L(d).activity > 0);
    const moodDays = week.filter((d) => L(d).mood);
    const loggedDays = week.filter(
      (d) => L(d).sleep || L(d).water || L(d).activity || L(d).mood || L(d).energy
    ).length;

    const lowSleep = sleepDays.filter((d) => L(d).sleep < goals.sleep).length;
    const metWater = waterDays.filter((d) => L(d).water >= goals.water).length;
    const lowMood = moodDays.filter((d) => ["sad", "frustrated"].includes(L(d).mood)).length;
    const lowEnergyDays = week.filter((d) => L(d).energy === "low");
    const lowEnergyShortSleep = lowEnergyDays.filter(
      (d) => L(d).sleep > 0 && L(d).sleep < goals.sleep
    ).length;

    // ----- week food -----
    const food = foodStats(week, meals);
    const ironRef = account?.age === "13–17" ? 15 : 18;

    // ----- cycle -----
    const summary = getSummary(periods);
    const phase = getPhase(periods);

    const strongDays = month.filter((d) =>
      Object.values(symptoms[d] || {}).some((v) => v === 3)
    ).length;

    // ----- data check -----
    const areas = [
      { id: "food", label: "Food", icon: Apple, tint: "bg-orange-100 text-orange-500", ok: food.foodDays >= 3, detail: `${food.foodDays} of 7 days` },
      { id: "sleep", label: "Sleep", icon: Moon, tint: "bg-indigo-100 text-indigo-500", ok: sleepDays.length >= 3, detail: `${sleepDays.length} of 7 days` },
      { id: "water", label: "Water", icon: Droplets, tint: "bg-sky-100 text-sky-500", ok: waterDays.length >= 3, detail: `${waterDays.length} of 7 days` },
      { id: "activity", label: "Activity", icon: Footprints, tint: "bg-emerald-100 text-emerald-500", ok: activeDays.length >= 3, detail: `${activeDays.length} of 7 days` },
      { id: "mood", label: "Mood", icon: Smile, tint: "bg-amber-100 text-amber-500", ok: moodDays.length >= 3, detail: `${moodDays.length} of 7 days` },
      { id: "cycle", label: "Cycle", icon: CalendarHeart, tint: "bg-rose-100 text-rose-500", ok: periods.length >= 1, detail: `${periods.length} period${periods.length === 1 ? "" : "s"}` },
    ];

    // ----- suggestions (simple, explainable rules) -----
    const out = [];

    if (sleepDays.length >= 3) {
      if (lowSleep >= Math.ceil(sleepDays.length / 2)) {
        out.push({
          id: "sleep-short",
          icon: Moon,
          tint: "bg-indigo-100 text-indigo-500",
          title: "Try winding down a little earlier",
          tip: "A steady bedtime and keeping screens away for the last 30 minutes can make sleep easier.",
          why: `Your sleep was under your ${goals.sleep}h goal on ${lowSleep} of the ${sleepDays.length} days you logged this week.`,
        });
      } else if (lowSleep === 0) {
        out.push({
          id: "good-sleep",
          icon: Check,
          tint: "bg-emerald-100 text-emerald-500",
          title: "Your sleep routine looks steady 🌙",
          tip: "Keep doing what's working for you.",
          why: `You met your ${goals.sleep}h goal on all ${sleepDays.length} days you logged.`,
        });
      }
    }

    if (waterDays.length >= 3 && metWater < Math.ceil(waterDays.length / 2)) {
      out.push({
        id: "water-low",
        icon: Droplets,
        tint: "bg-sky-100 text-sky-500",
        title: "Sip a little more through the day",
        tip: "Keep a bottle nearby and have a glass with each meal.",
        why: `You reached your ${goals.water}-glass goal on ${metWater} of ${waterDays.length} logged days.`,
      });
    }

    if (loggedDays >= 3 && activeDays.length <= 2) {
      out.push({
        id: "activity-low",
        icon: Footprints,
        tint: "bg-emerald-100 text-emerald-500",
        title: "Small movement counts",
        tip: "A 10-minute walk, some stretching or dancing to a favourite song all count.",
        why: `You logged activity on ${activeDays.length} of the last 7 days.`,
      });
    }

    if (food.skipped >= 2) {
      out.push({
        id: "skipped-meals",
        icon: Apple,
        tint: "bg-orange-100 text-orange-500",
        title: "Regular meals help your energy",
        tip: "Even something small, like fruit, roasted chana or a glass of milk, can help. If mealtimes feel stressful, it's okay to talk to someone you trust.",
        why: `You marked ${food.skipped} meals as skipped this week.`,
      });
    }

    if (food.foodDays >= 3 && food.avgIron < ironRef * 0.5) {
      const ideas = foods
        .filter(
          (f) =>
            f.iron >= 1.5 &&
            dietAllowed(profile.diet, f.diet) &&
            !f.allergens.some((a) => allergies.includes(a))
        )
        .sort((a, b) => b.iron - a.iron)
        .slice(0, 4)
        .map((f) => f.name);
      out.push({
        id: "iron-low",
        icon: Droplet,
        tint: "bg-red-100 text-red-500",
        title: "Add some iron-rich foods",
        tip: `Ideas for you: ${ideas.join(", ")}. A squeeze of lemon helps absorption. If you often feel very tired or dizzy, a doctor can check.`,
        why: `Your logged meals averaged about ${round1(food.avgIron)} mg of iron on the ${food.foodDays} days you logged food, compared with a general reference of about ${ironRef} mg. Values are approximate.`,
      });
    }

    if (moodDays.length >= 3 && lowMood >= 3) {
      out.push({
        id: "mood-low",
        icon: Smile,
        tint: "bg-amber-100 text-amber-500",
        title: "Be gentle with yourself",
        tip: "A short break, some fresh air, music or a chat with someone you trust can help. If low moods last or feel heavy, please talk to a trusted adult or a doctor.",
        why: `${lowMood} of your ${moodDays.length} mood entries this week were sad or frustrated. This isn't a diagnosis.`,
      });
    }

    if (lowEnergyDays.length >= 2 && lowEnergyShortSleep >= 2) {
      out.push({
        id: "energy-sleep",
        icon: Sparkles,
        tint: "bg-lav-100 text-lav-500",
        title: "Low energy days matched shorter sleep",
        tip: "Protecting your sleep a little more might lift your energy. It's just a pattern, so notice what feels right for you.",
        why: `On ${lowEnergyShortSleep} of your ${lowEnergyDays.length} low-energy days, you also slept less than your ${goals.sleep}h goal.`,
      });
    }

    if (phase) {
      const info = phases[phase.key];
      const ideas = info.foods
        .filter((f) => !f.a.some((x) => allergies.includes(x)))
        .slice(0, 3)
        .map((f) => f.n);
      out.push({
        id: `cycle-${phase.key}`,
        icon: CalendarHeart,
        tint: "bg-rose-100 text-rose-500",
        title: `${info.label}: ${info.intro}`,
        tip: `Food ideas: ${ideas.join(", ")}.`,
        why: `From your recorded dates, you may be on day ${phase.day} of about ${phase.len}. Estimates can be off, especially if your cycles change.`,
      });
    }

    if (summary?.irregular) {
      out.push({
        id: "irregular",
        icon: CalendarHeart,
        tint: "bg-amber-100 text-amber-500",
        title: "Your cycle lengths have varied",
        tip: "Keep logging so the picture gets clearer. Cycles are often irregular in the first years after they begin. If you're worried, a doctor can help.",
        why: "Your recorded cycle lengths differ by more than a week.",
      });
    }

    if (strongDays >= 3) {
      out.push({
        id: "strong-symptoms",
        icon: Info,
        tint: "bg-rose-100 text-rose-500",
        title: "Strong symptoms noted often",
        tip: "Rest and a warm compress may help. If pain is severe or stops you from doing daily things, please see a doctor.",
        why: `You marked a symptom as strong on ${strongDays} of the last 30 days.`,
      });
    }

    // ----- snapshot -----
    const moodCounts = {};
    moodDays.forEach((d) => (moodCounts[L(d).mood] = (moodCounts[L(d).mood] || 0) + 1));
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const snapshot = {
      sleep: sleepDays.length ? round1(mean(sleepDays.map((d) => L(d).sleep))) : null,
      water: waterDays.length ? round1(mean(waterDays.map((d) => L(d).water))) : null,
      activity: activeDays.length ? Math.round(mean(activeDays.map((d) => L(d).activity))) : null,
      foodDays: food.foodDays,
      topMood,
    };

    // ----- doctor summary data (last 30 days / all periods) -----
    const mSleep = month.filter((d) => L(d).sleep > 0);
    const mWater = month.filter((d) => L(d).water > 0);
    const mActive = month.filter((d) => L(d).activity > 0);
    const mMoods = {};
    month.forEach((d) => {
      if (L(d).mood) mMoods[L(d).mood] = (mMoods[L(d).mood] || 0) + 1;
    });
    const mFood = foodStats(month, meals);

    const symCounts = {};
    const symStrong = {};
    Object.values(symptoms).forEach((day) =>
      Object.entries(day).forEach(([id, lvl]) => {
        symCounts[id] = (symCounts[id] || 0) + 1;
        if (lvl === 3) symStrong[id] = (symStrong[id] || 0) + 1;
      })
    );

    const lens = cycleLengths(periods);
    const doctor = {
      periods: [...periods].slice(-6).reverse().map((p) => ({
        ...p,
        len: lens.find((l) => l.to === p.start)?.length || null,
        dur: p.end ? daysBetween(p.start, p.end) + 1 : null,
      })),
      summary,
      avgPeriod: avgPeriodLength(periods),
      symptoms: Object.entries(symCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id, n]) => ({ label: symptomLabels[id] || id, n, strong: symStrong[id] || 0 })),
      life: {
        days: month.filter((d) => L(d).sleep || L(d).water || L(d).activity || L(d).mood).length,
        sleep: mSleep.length ? round1(mean(mSleep.map((d) => L(d).sleep))) : null,
        water: mWater.length ? round1(mean(mWater.map((d) => L(d).water))) : null,
        activity: mActive.length ? Math.round(mean(mActive.map((d) => L(d).activity))) : null,
        moods: mMoods,
      },
      food: mFood,
    };

    return { areas, suggestions: out, snapshot, doctor };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isHidden = (id) => dismissed[id] && daysBetween(dismissed[id], today) < 7;
  const visible = data.suggestions.filter((s) => !isHidden(s.id));
  const hiddenCount = data.suggestions.length - visible.length;
  const enoughAreas = data.areas.filter((a) => a.ok).length;

  const toggle = (key) => setInclude({ ...include, [key]: !include[key] });
  const { doctor } = data;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold text-slate-800">Insights</h1>
        <p className="text-slate-400">Friendly notes based only on what you've logged.</p>
      </div>

      {/* Data check */}
      <div className="card print:hidden">
        <p className="font-semibold text-slate-800">What we can see this week</p>
        <p className="text-sm text-slate-400">
          {enoughAreas === 0
            ? "Log a few days and your insights will start to appear."
            : `${enoughAreas} of 6 areas have enough entries to look at.`}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {data.areas.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl p-3 text-center ${a.ok ? "bg-white shadow-sm" : "bg-slate-50"}`}
            >
              <div className={`mx-auto grid h-10 w-10 place-items-center rounded-xl ${a.ok ? a.tint : "bg-slate-100 text-slate-300"}`}>
                <a.icon size={18} />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">{a.label}</p>
              <p className="text-xs text-slate-400">{a.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Snapshot */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 print:hidden">
        <div className="card !p-5">
          <p className="text-xs font-medium text-slate-400">Avg sleep</p>
          <p className="mt-1 text-lg font-bold text-indigo-500">
            {data.snapshot.sleep ? `${data.snapshot.sleep} h` : "–"}
          </p>
        </div>
        <div className="card !p-5">
          <p className="text-xs font-medium text-slate-400">Avg water</p>
          <p className="mt-1 text-lg font-bold text-sky-500">
            {data.snapshot.water ? `${data.snapshot.water} glasses` : "–"}
          </p>
        </div>
        <div className="card !p-5">
          <p className="text-xs font-medium text-slate-400">Avg activity</p>
          <p className="mt-1 text-lg font-bold text-emerald-500">
            {data.snapshot.activity ? `${data.snapshot.activity} min` : "–"}
          </p>
        </div>
        <div className="card !p-5">
          <p className="text-xs font-medium text-slate-400">Days with meals</p>
          <p className="mt-1 text-lg font-bold text-orange-500">{data.snapshot.foodDays} of 7</p>
        </div>
        <div className="card col-span-2 !p-5 lg:col-span-1">
          <p className="text-xs font-medium text-slate-400">Most common mood</p>
          <p className="mt-1 text-2xl">{data.snapshot.topMood ? moods[data.snapshot.topMood] : "–"}</p>
        </div>
      </div>

      {/* Suggestions */}
      <div className="print:hidden">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Suggestions for you</h2>
          {hiddenCount > 0 && (
            <button
              onClick={() => setDismissed(clearDismissed())}
              className="text-sm font-medium text-lav-500 hover:underline"
            >
              Show {hiddenCount} dismissed
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="card text-center text-slate-500">
            {data.suggestions.length === 0
              ? "Nothing needs your attention right now. Keep logging and check back 🌸"
              : "All caught up. You've dismissed everything for now 💜"}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="card !p-5"
              >
                <div className="flex items-start gap-4">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${s.tint}`}>
                    <s.icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">{s.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{s.tip}</p>
                    <p className="mt-3 rounded-xl bg-lav-50 px-3 py-2 text-xs text-slate-500">
                      <span className="font-semibold text-lav-600">Why you're seeing this: </span>
                      {s.why}
                    </p>
                  </div>
                  <button
                    onClick={() => setDismissed(dismissInsight(s.id))}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-300 transition hover:bg-slate-50 hover:text-slate-500"
                    aria-label="Dismiss suggestion"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">
          These are simple, explainable rules, not medical advice. Dismissed tips stay hidden for a
          week.
        </p>
      </div>

      {/* Doctor-Ready Summary */}
      <div>
        <div className="mb-3 flex items-center gap-2 print:hidden">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-500">
            <FileHeart size={18} />
          </span>
          <h2 className="text-lg font-bold text-slate-800">Doctor-Ready Summary</h2>
        </div>

        <div className="card mb-4 print:hidden">
          <p className="text-sm text-slate-500">
            Choose what to include, then print it or save it as a PDF to show a doctor. It's made
            on your device and nothing is sent anywhere.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["cycle", "Cycle"],
              ["symptoms", "Symptoms"],
              ["lifestyle", "Sleep, water, activity & mood"],
              ["food", "Food"],
              ["name", "My name"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 ${
                  include[key]
                    ? "bg-lav-500 text-white shadow-soft"
                    : "bg-slate-50 text-slate-500 hover:bg-lav-50"
                }`}
              >
                {include[key] && <Check size={14} />} {label}
              </button>
            ))}
          </div>
          <button onClick={() => window.print()} className="btn-primary mt-4">
            <Printer size={18} /> Print or save as PDF
          </button>
        </div>

        {/* The printable page */}
        <section className="rounded-3xl bg-white p-6 shadow-soft print:rounded-none print:p-0 print:shadow-none">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="flex items-center gap-2 text-xl font-bold text-lav-600">
                <Heart size={20} className="fill-brand-400 text-brand-400" /> Bloom summary
              </p>
              <p className="text-sm text-slate-500">
                {include.name && account?.name ? `${account.name} · ` : ""}
                Age range {account?.age || "not given"} · Made on {shortDate(today)}
              </p>
            </div>
          </div>

          {include.cycle && (
            <div className="mt-5">
              <p className="font-semibold text-slate-800">Periods</p>
              {doctor.periods.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">No periods recorded.</p>
              ) : (
                <>
                  <table className="mt-2 w-full text-left text-sm">
                    <thead className="text-xs text-slate-400">
                      <tr>
                        <th className="py-1 font-medium">Started</th>
                        <th className="py-1 font-medium">Ended</th>
                        <th className="py-1 font-medium">Length</th>
                        <th className="py-1 font-medium">Days since previous start</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      {doctor.periods.map((p) => (
                        <tr key={p.id} className="border-t border-slate-50">
                          <td className="py-1.5">{shortDate(p.start)}</td>
                          <td className="py-1.5">{p.end ? shortDate(p.end) : "not recorded"}</td>
                          <td className="py-1.5">{p.dur ? `${p.dur} days` : "–"}</td>
                          <td className="py-1.5">{p.len ? `${p.len} days` : "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-sm text-slate-600">
                    Average cycle length:{" "}
                    {doctor.summary?.avgLen ? `${doctor.summary.avgLen} days` : "not enough data"} ·
                    Average period length: {doctor.avgPeriod ? `${doctor.avgPeriod} days` : "not enough data"}
                    {doctor.summary?.irregular ? " · cycle lengths vary by more than a week" : ""}
                  </p>
                </>
              )}
            </div>
          )}

          {include.symptoms && (
            <div className="mt-5">
              <p className="font-semibold text-slate-800">Symptoms noted</p>
              {doctor.symptoms.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">No symptoms recorded.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm text-slate-600">
                  {doctor.symptoms.map((s) => (
                    <li key={s.label}>
                      {s.label}: on {s.n} day{s.n === 1 ? "" : "s"}
                      {s.strong ? ` (strong on ${s.strong})` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {include.lifestyle && (
            <div className="mt-5">
              <p className="font-semibold text-slate-800">Last 30 days</p>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                <li>Days with entries: {doctor.life.days}</li>
                <li>Average sleep: {doctor.life.sleep ? `${doctor.life.sleep} hours` : "not recorded"}</li>
                <li>Average water: {doctor.life.water ? `${doctor.life.water} glasses` : "not recorded"}</li>
                <li>
                  Average activity (on active days):{" "}
                  {doctor.life.activity ? `${doctor.life.activity} minutes` : "not recorded"}
                </li>
                <li>
                  Moods:{" "}
                  {Object.keys(doctor.life.moods).length
                    ? Object.entries(doctor.life.moods)
                        .map(([id, n]) => `${moods[id]} ×${n}`)
                        .join("  ")
                    : "not recorded"}
                </li>
              </ul>
            </div>
          )}

          {include.food && (
            <div className="mt-5">
              <p className="font-semibold text-slate-800">Food (approximate)</p>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                <li>Days with meals logged (last 30): {doctor.food.foodDays}</li>
                <li>Meals marked as skipped: {doctor.food.skipped}</li>
                <li>
                  Average iron on logged days:{" "}
                  {doctor.food.foodDays ? `about ${round1(doctor.food.avgIron)} mg` : "not recorded"}
                </li>
              </ul>
            </div>
          )}

          <div className="mt-6">
            <p className="font-semibold text-slate-800">Questions I'd like to ask</p>
            <div className="mt-2 space-y-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-b border-slate-200" />
              ))}
            </div>
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs text-slate-400">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            Self-recorded in the Bloom wellness app. Dates and values are approximate and are not a
            diagnosis.
          </p>
        </section>
      </div>

      <p className="text-center text-xs text-slate-400 print:hidden">
        Want a different view?{" "}
        <Link to="/app/track" className="font-medium text-lav-500 hover:underline">
          See your charts
        </Link>
      </p>
    </div>
  );
}