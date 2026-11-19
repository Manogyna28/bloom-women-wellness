import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  Droplets,
  Moon,
  Footprints,
  Plus,
  Minus,
  Trash2,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Sparkles,
  Brain,
} from "lucide-react";
import {
  getAccount,
  getProfile,
  getDefaultGoals,
  getLogs,
  updateLog,
  deleteLog,
  todayKey,
} from "../lib/storage.js";
import { addDays, toDate } from "../lib/cycle.js";

/* ---------- constants ---------- */

const moods = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "calm", emoji: "😌", label: "Calm" },
  { id: "neutral", emoji: "😐", label: "Neutral" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "frustrated", emoji: "😣", label: "Frustrated" },
];

const moodTint = {
  happy: "bg-amber-100",
  calm: "bg-sky-100",
  neutral: "bg-slate-100",
  sad: "bg-indigo-100",
  frustrated: "bg-rose-100",
};

const energies = [
  { id: "low", label: "Low", value: 1, icon: BatteryLow, text: "text-rose-500", bar: "bg-rose-400", on: "bg-rose-500 text-white" },
  { id: "moderate", label: "Moderate", value: 2, icon: BatteryMedium, text: "text-amber-500", bar: "bg-amber-400", on: "bg-amber-500 text-white" },
  { id: "high", label: "High", value: 3, icon: BatteryFull, text: "text-emerald-500", bar: "bg-emerald-400", on: "bg-emerald-500 text-white" },
];

const blank = { water: 0, sleep: 0, activity: 0, mood: null, energy: null, stress: null };

const hasData = (l) =>
  !!l && (l.water > 0 || l.sleep > 0 || l.activity > 0 || !!l.mood || !!l.energy || !!l.stress);

const prettyDate = (s) =>
  toDate(s).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

const round1 = (n) => Math.round(n * 10) / 10;
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

const summaryText = (l) => {
  const parts = [];
  if (l.water) parts.push(`💧 ${l.water}`);
  if (l.sleep) parts.push(`😴 ${l.sleep}h`);
  if (l.activity) parts.push(`🏃 ${l.activity}m`);
  const m = moods.find((x) => x.id === l.mood);
  if (m) parts.push(m.emoji);
  const e = energies.find((x) => x.id === l.energy);
  if (e) parts.push(`⚡ ${e.label}`);
  if (l.stress) parts.push(`🧠 ${l.stress}/10`);
  return parts.join("  ·  ");
};

/* ---------- chart pieces ---------- */

function ChartTip({ active, payload, unit, color }) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-2xl bg-white px-3 py-2 shadow-soft">
      <p className="text-xs text-slate-400">{prettyDate(p.date)}</p>
      <p className="font-semibold" style={{ color }}>
        {payload[0].value} {unit}
      </p>
    </div>
  );
}

function ChartCard({ icon: Icon, tint, title, color, data, dataKey, goal, unit, range, avg }) {
  const logged = data.filter((d) => d[dataKey]);
  const met = logged.filter((d) => d[dataKey] >= goal).length;
  const gradId = `grad-${dataKey}`;

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tint}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{title}</p>
            <p className="text-xs text-slate-400">
              Goal {goal} {unit}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color }}>
            {avg ?? "–"}
          </p>
          <p className="text-xs text-slate-400">average</p>
        </div>
      </div>

      {logged.length === 0 ? (
        <div className="mt-4 grid h-44 place-items-center rounded-2xl border-2 border-dashed border-slate-100 text-sm text-slate-400">
          Your {title.toLowerCase()} chart will bloom here 🌸
        </div>
      ) : (
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 16, right: 12, left: 12, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={range === 7 ? 0 : "preserveStartEnd"}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <YAxis hide domain={[0, (dataMax) => Math.max(goal * 1.3, dataMax * 1.15)]} />
              <Tooltip
                cursor={{ stroke: color, strokeOpacity: 0.25, strokeWidth: 1 }}
                content={<ChartTip unit={unit} color={color} />}
              />
              <ReferenceLine
                y={goal}
                stroke={color}
                strokeDasharray="5 5"
                strokeOpacity={0.5}
                label={{ value: "Goal", position: "insideTopRight", fill: color, fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
                fill={`url(#${gradId})`}
                connectNulls
                dot={{ r: 4, fill: "#ffffff", stroke: color, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: color, stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs font-medium" style={{ color }}>
          {logged.length ? `${met} of ${logged.length} days on goal` : "No entries yet"}
        </span>
        <span className="text-[11px] text-slate-400">Line joins the days you logged</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-1">
        {data.map((d) => {
          const v = d[dataKey];
          const style = v
            ? v >= goal
              ? { background: color }
              : { border: `2px solid ${color}`, background: "#fff" }
            : { background: "#f1f5f9" };
          return <span key={d.date} className="h-2.5 w-2.5 rounded-full" style={style} />;
        })}
      </div>
    </div>
  );
}

function DayTiles({ days, range, render }) {
  const cols = range === 7 ? 7 : 10;
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {days.map((d) => (
        <div key={d.date} className="flex flex-col items-center gap-1">
          {render(d)}
          <span className="text-[10px] text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
/* ---------- experimental sleep-quality estimate ---------- */

const SLEEP_API = import.meta.env.VITE_SLEEP_API || "http://127.0.0.1:8001/predict";
const LIMITS = {
  age: [27, 59],
  sleep: [5.8, 8.5],
  activity: [30, 90],
  stress: [3, 8],
};
const outside = (v, [lo, hi]) => v < lo || v > hi;

function PredictCard({ entry, accountAge }) {
  const [age, setAge] = useState(/^\d+$/.test(String(accountAge ?? "")) ? String(accountAge) : "");
  const [state, setState] = useState({ status: "idle" });

  const run = async () => {
    const values = {
      age: Number(age),
      sleep_duration: entry.sleep,
      physical_activity: entry.activity,
      stress_level: entry.stress,
    };

    // Check ranges here first, so nothing is sent if the model can't handle it
        const problems = [];
    if (!age || outside(values.age, LIMITS.age))
      problems.push(
        age
          ? `You entered age ${age}; this estimate needs 27 to 59.`
          : "Enter your age (27 to 59) for this estimate."
      );
    if (!entry.sleep || outside(values.sleep_duration, LIMITS.sleep))
      problems.push(
        entry.sleep
          ? `You logged ${entry.sleep} h of sleep; this needs 6 to 8 hours.`
          : "Log your sleep above (6 to 8 hours)."
      );
    if (!entry.activity || outside(values.physical_activity, LIMITS.activity))
      problems.push(
        entry.activity
          ? `You logged ${entry.activity} min of activity; this needs 30 to 90.`
          : "Log your activity above (30 to 90 minutes)."
      );
    if (entry.stress == null || outside(values.stress_level, LIMITS.stress))
      problems.push(
        entry.stress == null
          ? "Log your stress level above (3 to 8)."
          : `You logged stress ${entry.stress}; this needs 3 to 8.`
      );

    if (problems.length) {
      setState({ status: "unavailable", problems });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch(SLEEP_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: values.age,
          sleep_duration: values.sleep_duration,
          physical_activity: values.physical_activity,
          stress_level: values.stress_level,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({
          status: "unavailable",
          problems: data?.detail?.problems || ["The estimate isn't available for these values."],
        });
        return;
      }
      setState({ status: "done", result: data });
    } catch {
      setState({ status: "error" });
    }
  };

  const r = state.result;
  const good = r?.prediction === "likely_good";

  return (
    <div className="card">
      <p className="flex items-center gap-2 font-semibold text-slate-800">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-100 text-indigo-500">
          <Brain size={18} />
        </span>
        Sleep quality estimate{" "}
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-600">
          Experimental
        </span>
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Uses the sleep, activity and stress you logged for this day, plus your age. Only these four
        numbers are sent, and nothing is saved.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-500">
          Your age
          <input
            type="number"
            min="1"
            max="120"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="ml-2 w-20 rounded-xl border border-lav-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-lav-400"
          />
        </label>
        <button
          onClick={run}
          disabled={state.status === "loading"}
          className="btn-primary"
        >
          {state.status === "loading" ? "Checking…" : "Estimate"}
        </button>
      </div>

      {state.status === "done" && (
        <div className={`mt-4 rounded-2xl p-4 ${good ? "bg-emerald-50" : "bg-amber-50"}`}>
          <p className={`font-semibold ${good ? "text-emerald-600" : "text-amber-600"}`}>
            {good ? "Likely good sleep quality" : "Likely lower sleep quality"}
          </p>
          <p className="text-sm text-slate-500">
            About {Math.round(r.estimated_confidence * 100)}% confidence from a small model.
          </p>
        </div>
      )}

      {state.status === "unavailable" && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium">Not enough information for an estimate</p>
          <ul className="mt-1 list-disc pl-5 text-slate-500">
            {state.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {state.status === "error" && (
        <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-600">
          Couldn't reach the estimate service. Make sure it is running, then try again.
        </p>
      )}

      <p className="mt-3 text-xs text-slate-400">
        Experimental educational estimate from a small dataset. Not medical advice and not a
        diagnosis.
      </p>
    </div>
  );
}

/* ---------- page ---------- */

export default function Track() {
  const account = getAccount();
  const profile = getProfile();
  const goals = profile?.goals || getDefaultGoals(account?.age);
  const today = todayKey();

  const [logs, setLogs] = useState(getLogs());
  const [range, setRange] = useState(7);
  const [selected, setSelected] = useState(today);

  const entry = { ...blank, ...(logs[selected] || {}) };
  const patch = (p) => setLogs(updateLog(selected, p));

  /* ----- chart data ----- */

  const days = useMemo(() => {
    const out = [];
    for (let i = range - 1; i >= 0; i--) {
      const ds = addDays(today, -i);
      const l = logs[ds] || {};
      out.push({
        date: ds,
        label:
          range === 7
            ? toDate(ds).toLocaleDateString("en-IN", { weekday: "short" })
            : String(Number(ds.slice(8))),
        water: l.water || null,
        sleep: l.sleep || null,
        activity: l.activity || null,
        mood: l.mood || null,
        energy: l.energy || null,
        logged: hasData(l),
      });
    }
    return out;
  }, [logs, range, today]);

  const loggedDays = days.filter((d) => d.logged).length;
  const sleepDays = days.filter((d) => d.sleep);
  const waterDays = days.filter((d) => d.water);
  const activeDays = days.filter((d) => d.activity);

  const avgSleep = sleepDays.length ? round1(mean(sleepDays.map((d) => d.sleep))) : null;
  const avgWater = waterDays.length ? round1(mean(waterDays.map((d) => d.water))) : null;
  const avgActivity = activeDays.length ? Math.round(mean(activeDays.map((d) => d.activity))) : null;

  /* ----- gentle patterns (from the user's own entries) ----- */

  const patterns = useMemo(() => {
    if (loggedDays < 3) return null;
    const out = [];

    if (sleepDays.length >= 3) {
      const low = sleepDays.filter((d) => d.sleep < goals.sleep).length;
      if (low === 0) {
        out.push(`You met your ${goals.sleep}h sleep goal on every day you logged. Lovely routine! 🌙`);
      } else {
        out.push(
          `Your sleep was under ${goals.sleep}h on ${low} of ${sleepDays.length} logged days.` +
            (low / sleepDays.length >= 0.5
              ? " A steady bedtime and a screen-free wind-down can help."
              : "")
        );
      }
    }

    if (waterDays.length >= 3) {
      const met = waterDays.filter((d) => d.water >= goals.water).length;
      out.push(`You reached your water goal on ${met} of ${waterDays.length} logged days. 💧`);
    }

    if (activeDays.length > 0) {
      out.push(`You logged some activity on ${activeDays.length} of the last ${range} days. 🌿`);
    }

    const both = days.filter((d) => d.sleep && d.energy);
    const rested = both.filter((d) => d.sleep >= goals.sleep);
    const short = both.filter((d) => d.sleep < goals.sleep);
    if (rested.length >= 2 && short.length >= 2) {
      const e = (arr) =>
        mean(arr.map((d) => energies.find((x) => x.id === d.energy)?.value || 0));
      if (e(rested) > e(short) + 0.3) {
        out.push(
          "In your entries, energy was usually higher on days with more sleep. This is just a pattern in your own logs, not a cause."
        );
      }
    }

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, goals.sleep, goals.water]);

  /* ----- recent entries ----- */

  const recent = Object.keys(logs)
    .filter((k) => hasData(logs[k]))
    .sort()
    .reverse()
    .slice(0, 10);

  /* ----- render ----- */

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Track</h1>
          <p className="text-slate-400">See how your everyday habits add up.</p>
        </div>
        <div className="flex rounded-full bg-white/80 p-1 shadow-sm">
          {[7, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                range === r ? "bg-lav-500 text-white shadow-soft" : "text-slate-500 hover:text-lav-600"
              }`}
            >
              {r === 7 ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          icon={Moon}
          tint="bg-indigo-100 text-indigo-500"
          title="Sleep"
          color="#818cf8"
          data={days}
          dataKey="sleep"
          goal={goals.sleep}
          unit="h"
          range={range}
          avg={avgSleep ? `${avgSleep} h` : null}
        />
        <ChartCard
          icon={Droplets}
          tint="bg-sky-100 text-sky-500"
          title="Water"
          color="#38bdf8"
          data={days}
          dataKey="water"
          goal={goals.water}
          unit="glasses"
          range={range}
          avg={avgWater ? `${avgWater}` : null}
        />
        <div className="lg:col-span-2">
          <ChartCard
            icon={Footprints}
            tint="bg-emerald-100 text-emerald-500"
            title="Activity"
            color="#34d399"
            data={days}
            dataKey="activity"
            goal={goals.activity}
            unit="min"
            range={range}
            avg={avgActivity ? `${avgActivity} min` : null}
          />
        </div>
      </div>

      {/* Mood & energy */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <p className="font-semibold text-slate-800">Mood</p>
          <p className="mb-4 text-sm text-slate-400">How you felt each day</p>
          <DayTiles
            days={days}
            range={range}
            render={(d) => {
              const m = moods.find((x) => x.id === d.mood);
              return (
                <div
                  className={`grid h-11 w-full place-items-center rounded-2xl ${
                    m ? moodTint[m.id] : "bg-slate-50"
                  }`}
                >
                  {m ? (
                    <span className="text-xl">{m.emoji}</span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                  )}
                </div>
              );
            }}
          />
        </div>

        <div className="card">
          <p className="font-semibold text-slate-800">Energy</p>
          <p className="mb-4 text-sm text-slate-400">Taller bars mean more energy</p>
          <DayTiles
            days={days}
            range={range}
            render={(d) => {
              const e = energies.find((x) => x.id === d.energy);
              return (
                <div className="flex h-11 w-full flex-col-reverse items-center justify-center gap-1 rounded-2xl bg-slate-50">
                  {e ? (
                    [1, 2, 3].map((n) => (
                      <span
                        key={n}
                        className={`h-1.5 w-5 rounded-full ${n <= e.value ? e.bar : "bg-slate-200"}`}
                      />
                    ))
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* Patterns */}
      <div className="card">
        <p className="flex items-center gap-2 font-semibold text-slate-800">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-lav-100 text-lav-500">
            <Sparkles size={18} />
          </span>
          Patterns in your entries
        </p>
        {!patterns ? (
          <p className="mt-3 text-sm text-slate-500">
            Log at least 3 days in this range to start seeing patterns. No pressure, skipped
            days are fine.
          </p>
        ) : patterns.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Nothing stands out yet. Keep logging what you like and check back.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {patterns.map((p) => (
              <li key={p} className="rounded-2xl bg-lav-50 p-3 text-sm text-slate-600">
                {p}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-400">
          These notes only describe what you logged. They can't diagnose anything.
        </p>
      </div>

      {/* Day editor */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-800">Add or edit a day</p>
            <p className="text-sm text-slate-400">
              {prettyDate(selected)} · everything here is optional
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelected(today)}
              className="rounded-full bg-lav-50 px-3 py-1.5 text-sm font-medium text-lav-600 transition hover:bg-lav-100"
            >
              Today
            </button>
            <button
              onClick={() => setSelected(addDays(today, -1))}
              className="rounded-full bg-lav-50 px-3 py-1.5 text-sm font-medium text-lav-600 transition hover:bg-lav-100"
            >
              Yesterday
            </button>
            <input
              type="date"
              max={today}
              value={selected}
              onChange={(e) => e.target.value && setSelected(e.target.value)}
              className="rounded-xl border border-lav-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-lav-400"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {/* Water */}
          <div className="rounded-2xl bg-sky-50 p-4">
            <p className="flex items-center gap-2 font-medium text-sky-600">
              <Droplets size={16} /> Water
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => patch({ water: Math.max(0, entry.water - 1) })}
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-sky-600 transition active:scale-90"
                aria-label="Fewer glasses"
              >
                <Minus size={16} />
              </button>
              <span className="w-24 text-center font-semibold text-slate-700">
                {entry.water} glass{entry.water === 1 ? "" : "es"}
              </span>
              <button
                onClick={() => patch({ water: entry.water + 1 })}
                className="grid h-9 w-9 place-items-center rounded-full bg-sky-500 text-white transition active:scale-90"
                aria-label="More glasses"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="flex items-center gap-2 font-medium text-emerald-600">
              <Footprints size={16} /> Activity
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => patch({ activity: Math.max(0, entry.activity - 10) })}
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-emerald-600 transition active:scale-90"
                aria-label="Less activity"
              >
                <Minus size={16} />
              </button>
              <span className="w-24 text-center font-semibold text-slate-700">
                {entry.activity} min
              </span>
              <button
                onClick={() => patch({ activity: entry.activity + 10 })}
                className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white transition active:scale-90"
                aria-label="More activity"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Sleep */}
          <div className="rounded-2xl bg-indigo-50 p-4">
            <p className="flex items-center gap-2 font-medium text-indigo-600">
              <Moon size={16} /> Sleep
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[4, 5, 6, 7, 8, 9, 10].map((h) => (
                <button
                  key={h}
                  onClick={() => patch({ sleep: entry.sleep === h ? 0 : h })}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition active:scale-95 ${
                    entry.sleep === h
                      ? "bg-indigo-500 text-white"
                      : "bg-white text-indigo-600 hover:bg-indigo-100"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="font-medium text-amber-600">Energy</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {energies.map((e) => (
                <button
                  key={e.id}
                  onClick={() => patch({ energy: entry.energy === e.id ? null : e.id })}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
                    entry.energy === e.id ? e.on : `bg-white ${e.text} hover:opacity-80`
                  }`}
                >
                  <e.icon size={16} /> {e.label}
                </button>
              ))}
            </div>
          </div>
                    {/* Stress */}
          <div className="rounded-2xl bg-rose-50 p-4 md:col-span-2">
            <p className="font-medium text-rose-600">Stress level (1 = calm, 10 = very stressed)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => patch({ stress: entry.stress === n ? null : n })}
                  className={`h-9 w-9 rounded-full text-sm font-medium transition active:scale-95 ${
                    entry.stress === n
                      ? "bg-rose-500 text-white"
                      : "bg-white text-rose-600 hover:bg-rose-100"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="rounded-2xl bg-lav-50 p-4 md:col-span-2">
            <p className="font-medium text-lav-600">Mood</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => patch({ mood: entry.mood === m.id ? null : m.id })}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-2 transition active:scale-95 ${
                    entry.mood === m.id
                      ? "border-lav-500 bg-white shadow-soft"
                      : "border-transparent bg-white/60 hover:border-lav-200"
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[11px] font-medium text-slate-500">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {hasData(logs[selected]) && (
          <button
            onClick={() => setLogs(deleteLog(selected))}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-rose-500"
          >
            <Trash2 size={14} /> Clear this day's entry
          </button>
        )}
      </div>
      <PredictCard entry={entry} accountAge={account?.age} />

      {/* Past entries */}
      <div className="card">
        <p className="font-semibold text-slate-800">Past entries</p>
        <p className="text-sm text-slate-400">Tap one to edit it.</p>

        {recent.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Nothing logged yet. Your entries will show up here 🌸
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {recent.map((ds) => (
              <motion.div
                key={ds}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition ${
                  selected === ds ? "bg-lav-50 ring-2 ring-lav-300" : "bg-slate-50"
                }`}
              >
                <button onClick={() => setSelected(ds)} className="min-w-0 flex-1 text-left">
                  <p className="font-medium text-slate-700">
                    {ds === today ? "Today" : prettyDate(ds)}
                  </p>
                  <p className="truncate text-xs text-slate-400">{summaryText(logs[ds])}</p>
                </button>
                <button
                  onClick={() => setLogs(deleteLog(ds))}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                  aria-label="Delete entry"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        For wellness awareness only. Bloom can't diagnose or treat anything.
      </p>
    </div>
  );
}