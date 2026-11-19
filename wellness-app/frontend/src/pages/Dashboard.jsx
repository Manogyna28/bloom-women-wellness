import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Droplets,
  Moon,
  Footprints,
  Plus,
  Minus,
  CalendarHeart,
  Flower2,
  Droplet,
  FileHeart,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  getAccount,
  getProfile,
  getDefaultGoals,
  getTodayLog,
  updateTodayLog,
  getPeriods,
  addPeriod,
  todayKey,
} from "../lib/storage.js";
import { getPhase } from "../lib/cycle.js";
import { phases } from "../data/phases.js";

/* ---------- helpers ---------- */

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const moods = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "calm", emoji: "😌", label: "Calm" },
  { id: "neutral", emoji: "😐", label: "Neutral" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "frustrated", emoji: "😣", label: "Frustrated" },
];

/* ---------- small components ---------- */

function Ring({ pct, color, size = 92, stroke = 9, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(pct, 1)) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const roundBtn =
  "grid h-9 w-9 place-items-center rounded-full transition active:scale-90";

/* ---------- page ---------- */

export default function Dashboard() {
  const account = getAccount();
  const profile = getProfile();
  const goals = profile?.goals || getDefaultGoals(account?.age);
  const allergies = profile?.allergies || [];
  const discreet = !!profile?.discreet;

  const [log, setLog] = useState(getTodayLog());
  const [periods, setPeriods] = useState(getPeriods());
  const [dateInput, setDateInput] = useState("");

  const patch = (p) => setLog(updateTodayLog(p));

  const phase = getPhase(periods);
  const phaseInfo = phase ? phases[phase.key] : null;
  const foodIdeas = phaseInfo
    ? phaseInfo.foods.filter((f) => !f.a.some((x) => allergies.includes(x))).slice(0, 4)
    : [];

  const saveLastPeriod = (dateStr) => {
    if (!dateStr) return;
    setPeriods(addPeriod(dateStr));
  };

  const waterDone = log.water >= goals.water;
  const sleepDone = log.sleep >= goals.sleep;
  const activityDone = log.activity >= goals.activity;

  const selectedMood = moods.find((m) => m.id === log.mood);

  const teasers = [
    { icon: Flower2, title: "Cycle-Sync Eating", to: "/app/cycle", tint: "bg-rose-100 text-rose-500" },
    { icon: Droplet, title: "Iron Boost", to: "/app/food", tint: "bg-red-100 text-red-500" },
    { icon: FileHeart, title: "Doctor-Ready Summary", to: "/app/insights", tint: "bg-emerald-100 text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <p className="text-slate-400">{greeting()}</p>
        <h1 className="text-3xl font-bold text-slate-800">
          Hi, {account?.name || "there"} 🌸
        </h1>
      </motion.div>

      {/* Progress rings */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Water */}
        <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp} className="card">
          <div className="flex items-center gap-4">
            <Ring pct={log.water / goals.water} color="#38bdf8">
              <Droplets className="text-sky-500" />
            </Ring>
            <div>
              <p className="font-semibold text-slate-800">Water</p>
              <p className="text-sm text-slate-400">
                {log.water} / {goals.water} glasses
              </p>
              {waterDone && <p className="mt-1 text-xs font-medium text-sky-500">Goal reached 💧</p>}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => patch({ water: Math.max(0, log.water - 1) })}
              className={`${roundBtn} bg-sky-50 text-sky-600`}
              aria-label="Remove a glass"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={() => patch({ water: log.water + 1 })}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-sky-500 py-2 font-medium text-white transition hover:bg-sky-600 active:scale-95"
            >
              <Plus size={16} /> Add a glass
            </button>
          </div>
        </motion.div>

        {/* Sleep */}
        <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp} className="card">
          <div className="flex items-center gap-4">
            <Ring pct={log.sleep / goals.sleep} color="#818cf8">
              <Moon className="text-indigo-500" />
            </Ring>
            <div>
              <p className="font-semibold text-slate-800">Sleep</p>
              <p className="text-sm text-slate-400">
                {log.sleep ? `${log.sleep}h` : "Not logged"} · goal {goals.sleep}h
              </p>
              {sleepDone && <p className="mt-1 text-xs font-medium text-indigo-500">Well rested 🌙</p>}
            </div>
          </div>
          <p className="mb-2 mt-4 text-xs font-medium text-slate-400">Last night I slept</p>
          <div className="flex flex-wrap gap-2">
            {[4, 5, 6, 7, 8, 9, 10].map((h) => (
              <button
                key={h}
                onClick={() => patch({ sleep: h })}
                className={`rounded-full px-3 py-1 text-sm font-medium transition active:scale-95 ${
                  log.sleep === h
                    ? "bg-indigo-500 text-white"
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </motion.div>

        {/* Activity */}
        <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp} className="card">
          <div className="flex items-center gap-4">
            <Ring pct={log.activity / goals.activity} color="#34d399">
              <Footprints className="text-emerald-500" />
            </Ring>
            <div>
              <p className="font-semibold text-slate-800">Activity</p>
              <p className="text-sm text-slate-400">
                {log.activity} / {goals.activity} min
              </p>
              {activityDone && <p className="mt-1 text-xs font-medium text-emerald-500">Nicely moved 🌿</p>}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {[10, 20, 30].map((m) => (
              <button
                key={m}
                onClick={() => patch({ activity: log.activity + m })}
                className="flex-1 rounded-full bg-emerald-50 py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-100 active:scale-95"
              >
                +{m}
              </button>
            ))}
            <button
              onClick={() => patch({ activity: 0 })}
              className={`${roundBtn} bg-slate-50 text-slate-400 hover:text-slate-600`}
              aria-label="Reset activity"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mood */}
      <motion.div custom={4} initial="hidden" animate="show" variants={fadeUp} className="card">
        <p className="font-semibold text-slate-800">How are you feeling today?</p>
        <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
          {moods.map((m) => (
            <button
              key={m.id}
              onClick={() => patch({ mood: m.id })}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 transition active:scale-95 ${
                log.mood === m.id
                  ? "border-lav-500 bg-lav-50 shadow-soft"
                  : "border-transparent bg-slate-50 hover:border-lav-200"
              }`}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-xs font-medium text-slate-500">{m.label}</span>
            </button>
          ))}
        </div>
        {selectedMood && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-lav-600"
          >
            Thanks for checking in. Feeling {selectedMood.label.toLowerCase()} is completely okay 💜
          </motion.p>
        )}
      </motion.div>

      {/* Cycle card */}
      <motion.div custom={5} initial="hidden" animate="show" variants={fadeUp} className="card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-500">
              <CalendarHeart />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{discreet ? "Your calendar" : "Your cycle"}</p>
              <p className="text-sm text-slate-400">Estimates only. Every body is different.</p>
            </div>
          </div>
          <Link
            to="/app/cycle"
            className="flex items-center gap-1 text-sm font-medium text-rose-500 hover:underline"
          >
            Calendar <ChevronRight size={14} />
          </Link>
        </div>

        {!phase ? (
          <div className="mt-5 rounded-2xl bg-rose-50 p-4">
            <p className="font-medium text-rose-600">
              Add the first day of your last period to see your phase and food ideas.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="date"
                max={todayKey()}
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="rounded-xl border border-rose-200 bg-white px-3 py-2 outline-none focus:border-rose-400"
              />
              <button
                onClick={() => saveLastPeriod(dateInput)}
                disabled={!dateInput}
                className="rounded-full bg-rose-500 px-5 py-2 font-medium text-white transition hover:bg-rose-600 active:scale-95 disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={() => saveLastPeriod(todayKey())}
                className="text-sm font-medium text-rose-500 hover:underline"
              >
                It started today
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className={`rounded-2xl p-4 ${phaseInfo.bg}`}>
              <p className={`text-sm font-semibold ${phaseInfo.color}`}>{phaseInfo.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                Day {phase.day}
                <span className="text-base font-medium text-slate-400"> of ~{phase.len}</span>
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {phase.daysToNext > 0
                  ? `Next period (estimate): in about ${phase.daysToNext} day${
                      phase.daysToNext === 1 ? "" : "s"
                    }`
                  : phase.overdueBy === 0
                  ? "Your period is estimated around today"
                  : "Your period is a little later than the estimate. That's common and can happen for many reasons."}
              </p>
              <button
                onClick={() => saveLastPeriod(todayKey())}
                className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-medium text-rose-500 shadow-sm transition hover:shadow active:scale-95"
              >
                My period started today
              </button>
              <Link
                to="/app/cycle"
                className="mt-3 block text-xs font-medium text-rose-500 hover:underline"
              >
                Wrong date? Edit or delete it
              </Link>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="flex items-center gap-2 font-semibold text-slate-800">
                <Flower2 size={18} className="text-rose-400" /> Cycle-sync food ideas
              </p>
              <p className="mt-1 text-sm text-slate-500">{phaseInfo.intro}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {foodIdeas.map((f) => (
                  <span
                    key={f.n}
                    className="rounded-full bg-lav-50 px-3 py-1 text-sm font-medium text-lav-600"
                  >
                    {f.n}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Food ideas for wellness awareness, not medical advice.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Bloom extras */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-800">Your Bloom extras</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {teasers.map((t, i) => (
            <motion.div
              key={t.title}
              custom={6 + i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              whileHover={{ y: -4 }}
            >
              <Link to={t.to} className="card flex h-full flex-col gap-3 !p-4">
                <div className={`grid h-11 w-11 place-items-center rounded-2xl ${t.tint}`}>
                  <t.icon size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                <span className="mt-auto flex items-center gap-1 text-xs font-medium text-lav-500">
                  Open <ChevronRight size={14} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}