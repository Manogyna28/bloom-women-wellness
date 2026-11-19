import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CalendarHeart,
  Flower2,
  Info,
  Trash2,
  Droplet,
  Check,
  Pencil,
  Plus,
} from "lucide-react";
import {
  getAccount,
  getProfile,
  todayKey,
  getToken,
} from "../lib/storage.js";
import {
  addDays,
  toDate,
  fmt,
  cycleLengths,
  getSummary,
  getPhase,
  predictedDates,
} from "../lib/cycle.js";
import { phases, phaseOrder } from "../data/phases.js";
import {
  getPeriods as getPeriodsApi,
  addPeriodApi,
  updatePeriodApi,
  deletePeriodApi,
  getSymptomsApi,
  saveSymptomsApi,
} from "../lib/api.js";


/* ---------- constants ---------- */

const symptomList = [
  { id: "cramps", label: "Cramps", emoji: "🌀" },
  { id: "headache", label: "Headache", emoji: "🤕" },
  { id: "fatigue", label: "Fatigue", emoji: "😴" },
  { id: "bloating", label: "Bloating", emoji: "🎈" },
  { id: "backpain", label: "Back pain", emoji: "🦴" },
  { id: "moodswings", label: "Mood swings", emoji: "🎭" },
  { id: "tender", label: "Tender breasts", emoji: "💗" },
  { id: "nausea", label: "Nausea", emoji: "🤢" },
  { id: "acne", label: "Acne", emoji: "🧴" },
  { id: "cravings", label: "Cravings", emoji: "🍫" },
];

const severityLabel = ["", "Mild", "Moderate", "Strong"];
const severityStyle = [
  "bg-slate-50 text-slate-500 hover:bg-lav-50",
  "bg-rose-100 text-rose-600",
  "bg-rose-300 text-rose-800",
  "bg-rose-500 text-white",
];

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

const monthName = (d) =>
  d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const prettyDate = (s) =>
  toDate(s).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

const shortDate = (s) =>
  toDate(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const dateInput =
  "mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-rose-400";

/* ---------- small components ---------- */

// Delete button with a "Are you sure?" step
function DeleteButton({ onConfirm }) {
  const [ask, setAsk] = useState(false);

  if (!ask) {
    return (
      <button
        onClick={() => setAsk(true)}
        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-500 shadow-sm transition hover:text-rose-500 active:scale-95"
      >
        <Trash2 size={14} /> Delete
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-500">Delete this period?</span>
      <button
        onClick={onConfirm}
        className="rounded-full bg-rose-500 px-3 py-1 font-medium text-white transition active:scale-95"
      >
        Yes, delete
      </button>
      <button onClick={() => setAsk(false)} className="font-medium text-slate-400 hover:text-slate-600">
        Keep
      </button>
    </span>
  );
}

// Edit the start and end dates. onSave returns an error message or null.
function PeriodEditor({ period, today, onSave, onCancel }) {
  const [start, setStart] = useState(period.start);
  const [end, setEnd] = useState(period.end || "");
  const [error, setError] = useState("");

  const invalid = !start || start > today || (end && (end < start || end > today));

  const save = async () => {
  const err = await onSave({ start, end: end || null });
  if (err) setError(err);
};

  return (
    <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-400">
          Start date
          <input
            type="date"
            max={today}
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setError("");
            }}
            className={dateInput}
          />
        </label>
        <label className="text-xs font-medium text-slate-400">
          End date (optional)
          <input
            type="date"
            min={start}
            max={today}
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              setError("");
            }}
            className={dateInput}
          />
        </label>
      </div>

      {(invalid || error) && (
        <p className="mt-2 text-xs text-rose-500">
          {error ||
            "Please check the dates. The end can't be before the start, and neither can be in the future."}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={save}
          disabled={invalid}
          className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 active:scale-95 disabled:opacity-40"
        >
          Save changes
        </button>
        <button
          onClick={onCancel}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Add an earlier (or any) period by date
function AddPeriodForm({ today, onAdd }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");

  const invalid = !start || start > today || (end && (end < start || end > today));

 const submit = async () => {
  const err = await onAdd(start, end || null);
  if (err) setError(err);
  else {
    setStart("");
    setEnd("");
    setError("");
  }
};

  return (
    <div className="mt-5 rounded-2xl bg-rose-50 p-4">
      <p className="flex items-center gap-2 font-medium text-rose-600">
        <Plus size={16} /> Add an earlier period
      </p>
      <p className="text-xs text-slate-400">More dates make your estimates more accurate.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-400">
          Start date
          <input type="date" max={today} value={start} onChange={(e) => setStart(e.target.value)} className={dateInput} />
        </label>
        <label className="text-xs font-medium text-slate-400">
          End date (optional)
          <input type="date" min={start} max={today} value={end} onChange={(e) => setEnd(e.target.value)} className={dateInput} />
        </label>
      </div>
      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
      <button
        onClick={submit}
        disabled={invalid}
        className="mt-3 rounded-full bg-rose-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-rose-600 active:scale-95 disabled:opacity-40"
      >
        Add period
      </button>
    </div>
  );
}

/* ---------- page ---------- */

export default function Cycle() {
  const account = getAccount();
  const profile = getProfile() || {};
  const allergies = profile.allergies || [];
  const discreet = !!profile.discreet;
  const today = todayKey();

const [periods, setPeriods] = useState([]);
const [symptoms, setSymptoms] = useState({});
const [loadingRecords, setLoadingRecords] = useState(true);
const [recordsError, setRecordsError] = useState("");
useEffect(() => {
  let active = true;

  const loadRecords = async () => {
    const token = getToken();

    if (!token) {
      if (active) {
        setRecordsError("Please log in again to load your cycle records.");
        setLoadingRecords(false);
      }
      return;
    }

    try {
      const [periodData, symptomData] = await Promise.all([
        getPeriodsApi(token),
        getSymptomsApi(token),
      ]);

      if (active) {
        setPeriods(periodData);
        setSymptoms(symptomData);
        setRecordsError("");
      }
    } catch (error) {
      if (active) {
        setRecordsError(error.message || "Could not load cycle records.");
      }
    } finally {
      if (active) {
        setLoadingRecords(false);
      }
    }
  };

  loadRecords();

  return () => {
    active = false;
  };
}, []);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [firstDate, setFirstDate] = useState("");
  const [panelEditing, setPanelEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const summary = useMemo(() => getSummary(periods), [periods]);
  const phase = useMemo(() => getPhase(periods), [periods]);
  const predicted = useMemo(() => predictedDates(periods), [periods]);
  const lengths = useMemo(() => cycleLengths(periods), [periods]);

  /* ----- helpers ----- */

  const pickDay = (ds) => {
    setSelected(ds);
    setPanelEditing(false);
  };

  // The period (if any) that a given day belongs to
  const periodAt = (ds) =>
    periods.find((p) =>
      ds === p.start
        ? true
        : p.end
        ? ds > p.start && ds <= p.end
        : ds > p.start && ds <= addDays(p.start, 4) && ds <= today
    ) || null;

  const dayStatus = (ds) => {
    for (const p of periods) {
      if (ds === p.start) return "start";
      if (p.end) {
        if (ds > p.start && ds <= p.end) return "recorded";
      } else if (ds > p.start && ds <= addDays(p.start, 4) && ds <= today) {
        return "assumed"; // end date unknown, so we don't claim these days
      }
    }
    return predicted.has(ds) ? "predicted" : null;
  };

  const cells = useMemo(() => {
    const first = month;
    const blanks = first.getDay();
    const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const list = Array(blanks).fill(null);
    for (let i = 1; i <= total; i++) {
      list.push(fmt(new Date(first.getFullYear(), first.getMonth(), i)));
    }
    return list;
  }, [month]);

  const cellClass = (ds) => {
    const st = dayStatus(ds);
    let cls = "text-slate-600 hover:bg-lav-50";
    if (st === "start") cls = "bg-rose-500 text-white font-semibold";
    else if (st === "recorded") cls = "bg-rose-400 text-white";
    else if (st === "assumed") cls = "bg-rose-200 text-rose-700";
    else if (st === "predicted")
      cls = "border-2 border-dashed border-rose-300 bg-rose-50 text-rose-500";
    else if (ds === today) cls = "border border-lav-300 font-bold text-lav-600";
    if (ds === selected) cls += " ring-2 ring-lav-500 ring-offset-1";
    return cls;
  };

  /* ----- actions (edit, delete, add) ----- */

 const startOn = async (ds) => {
  const token = getToken();

  if (!token) {
    setRecordsError("Please log in again to save your cycle records.");
    return;
  }

  try {
    setRecordsError("");
    const updatedPeriods = await addPeriodApi(token, { start: ds });
    setPeriods(updatedPeriods);
  } catch (error) {
    setRecordsError(error.message || "Could not save the period.");
  }
};

  const hasSameStart = (start, exceptId) =>
    periods.some((p) => p.start === start && p.id !== exceptId);

  // Returns an error string, or null when saved
  const saveEdit = async (id, { start, end }) => {
  if (hasSameStart(start, id)) {
    return "You already have a period starting on that date.";
  }

  const token = getToken();

  if (!token) {
    setRecordsError("Please log in again to update your cycle records.");
    return "Please log in again.";
  }

  try {
    setRecordsError("");

    const updatedPeriods = await updatePeriodApi(token, id, {
      start,
      end: end || null,
    });

    setPeriods(updatedPeriods);
    setPanelEditing(false);
    setEditingId(null);

    return null;
  } catch (error) {
    setRecordsError(error.message || "Could not update the period.");
    return error.message || "Could not update the period.";
  }
};

 const removePeriod = async (id) => {
  const token = getToken();

  if (!token) {
    setRecordsError("Please log in again to delete your cycle records.");
    return;
  }

  try {
    setRecordsError("");

    const updatedPeriods = await deletePeriodApi(token, id);

    setPeriods(updatedPeriods);
    setPanelEditing(false);
    setEditingId(null);
  } catch (error) {
    setRecordsError(error.message || "Could not delete the period.");
  }
};

  const addEarlier = async (start, end) => {
  if (hasSameStart(start, null)) {
    return "You already have a period starting on that date.";
  }

  const token = getToken();

  if (!token) {
    setRecordsError("Please log in again to save your cycle records.");
    return "Please log in again.";
  }

  try {
    setRecordsError("");

    const updatedPeriods = await addPeriodApi(token, {
      start,
      end: end || null,
    });

    setPeriods(updatedPeriods);
    return null;
  } catch (error) {
    setRecordsError(error.message || "Could not add the earlier period.");
    return error.message || "Could not add the earlier period.";
  }
};

  // The most recent period that began on or before the selected day (within 14 days)
  const periodForEnd = (ds) => {
    const candidates = periods
      .filter((p) => p.start <= ds && ds <= addDays(p.start, 14))
      .sort((a, b) => b.start.localeCompare(a.start));
    return candidates[0] || null;
  };

 const endOn = async (ds) => {
  const p = periodForEnd(ds);
  if (!p) return;

  const token = getToken();
  if (!token) {
    setRecordsError("Please log in again to update your cycle records.");
    return;
  }

  try {
    setRecordsError("");
    const updatedPeriods = await updatePeriodApi(token, p.id, { end: ds });
    setPeriods(updatedPeriods);
  } catch (error) {
    setRecordsError(error.message || "Could not save the period end date.");
  }
};
 const cycleSymptom = async (ds, id) => {
  const token = getToken();

  if (!token) {
    setRecordsError("Please log in again to save your symptoms.");
    return;
  }

  const current = { ...(symptoms[ds] || {}) };
  const next = ((current[id] || 0) + 1) % 4;

  if (next === 0) {
    delete current[id];
  } else {
    current[id] = next;
  }

  try {
    setRecordsError("");

    const updatedSymptoms = await saveSymptomsApi(token, ds, current);
    setSymptoms(updatedSymptoms);
  } catch (error) {
    setRecordsError(error.message || "Could not save symptoms.");
  }
};
  /* ----- derived ----- */

  const selectedIsFuture = selected > today;
  const pAt = periodAt(selected);
  const endCandidate = periodForEnd(selected);
  const selectedSymptoms = symptoms[selected] || {};

  const symptomCounts = useMemo(() => {
    const counts = {};
    Object.values(symptoms).forEach((day) =>
      Object.keys(day).forEach((id) => (counts[id] = (counts[id] || 0) + 1))
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, n]) => ({ ...symptomList.find((s) => s.id === id), n }))
      .filter((s) => s.label);
  }, [symptoms]);

  const loggedDays = Object.keys(symptoms).length;
  const lengthFor = (p) => lengths.find((l) => l.to === p.start)?.length;
  const isTeen = account?.age === "13–17";

  /* ----- render ----- */

  return (
    <div className="space-y-6">
          {loadingRecords && (
        <p className="rounded-xl bg-lav-50 p-3 text-sm text-lav-600">
          Loading your cycle records...
        </p>
      )}

      {recordsError && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
          {recordsError}
        </p>
      )}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{discreet ? "Calendar" : "Cycle"}</h1>
        <p className="text-slate-400">Private to you. Estimates are only a guide.</p>
      </div>

      {/* Stats */}
      {summary ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card !p-5">
            <p className="text-xs font-medium text-slate-400">Last period started</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{shortDate(summary.lastStart)}</p>
          </div>
          <div className="card !p-5">
            <p className="text-xs font-medium text-slate-400">Next period (estimate)</p>
            <p className="mt-1 text-lg font-bold text-rose-500">{shortDate(summary.nextStart)}</p>
          </div>
          <div className="card !p-5">
            <p className="text-xs font-medium text-slate-400">Average cycle</p>
            <p className="mt-1 text-lg font-bold text-slate-800">
              {summary.avgLen ? `${summary.avgLen} days` : "Not enough data yet"}
            </p>
          </div>
          <div className="card !p-5">
            <p className="text-xs font-medium text-slate-400">Average period</p>
            <p className="mt-1 text-lg font-bold text-slate-800">
              {periods.some((p) => p.end) ? `${summary.periodLen} days` : "Add end dates"}
            </p>
          </div>
        </div>
      ) : (
        <div className="card text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-500">
            <CalendarHeart />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-800">Let's start your calendar</h2>
          <p className="mt-1 text-slate-500">
            Add the first day of your most recent period. You can add older ones later, and you can
            always edit or delete a date.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <input
              type="date"
              max={today}
              value={firstDate}
              onChange={(e) => setFirstDate(e.target.value)}
              className="rounded-xl border border-rose-200 bg-white px-3 py-2 outline-none focus:border-rose-400"
            />
            <button
              onClick={() => firstDate && startOn(firstDate)}
              disabled={!firstDate}
              className="rounded-full bg-rose-500 px-5 py-2 font-medium text-white transition hover:bg-rose-600 active:scale-95 disabled:opacity-40"
            >
              Save
            </button>
            <button
              onClick={() => startOn(today)}
              className="text-sm font-medium text-rose-500 hover:underline"
            >
              It started today
            </button>
          </div>
        </div>
      )}

      {summary && !summary.avgLen && (
        <p className="flex items-start gap-2 rounded-2xl bg-lav-50 p-4 text-sm text-lav-600">
          <Info size={18} className="mt-0.5 shrink-0" />
          Add at least two periods to calculate your cycle length. Until then we use a common
          guess of 28 days, which may be off for you.
        </p>
      )}

      {summary?.irregular && (
        <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
          <Info size={18} className="mt-0.5 shrink-0" />
          Your recorded cycles vary quite a bit, so estimates may be less accurate. That's
          common and not a diagnosis. If it worries you, a doctor can help.
        </p>
      )}

      {/* Calendar + day panel */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="grid h-9 w-9 place-items-center rounded-full bg-lav-50 text-lav-600 transition active:scale-90"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="font-semibold text-slate-800">{monthName(month)}</p>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="grid h-9 w-9 place-items-center rounded-full bg-lav-50 text-lav-600 transition active:scale-90"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
            {weekdays.map((w, i) => (
              <div key={i} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((ds, i) =>
              ds ? (
                <button
                  key={ds}
                  onClick={() => pickDay(ds)}
                  className={`relative grid aspect-square place-items-center rounded-xl text-sm transition active:scale-90 ${cellClass(
                    ds
                  )}`}
                >
                  {Number(ds.slice(8))}
                  {symptoms[ds] && Object.keys(symptoms[ds]).length > 0 && (
                    <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-lav-500 ring-1 ring-white" />
                  )}
                </button>
              ) : (
                <div key={`b${i}`} />
              )
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-rose-500" /> Recorded
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-rose-200" /> End date unknown
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded border-2 border-dashed border-rose-300 bg-rose-50" />{" "}
              Estimated
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-lav-500" /> Symptoms logged
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Tap a coloured day to edit or delete that period.
          </p>
        </div>

        {/* Day panel */}
        <div className="card lg:col-span-2">
          <p className="text-sm font-medium text-slate-400">Selected day</p>
          <p className="text-xl font-bold text-slate-800">{prettyDate(selected)}</p>

          {selectedIsFuture ? (
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              This day is in the future. Dashed days on the calendar are estimates, not
              promises.
            </p>
          ) : (
            <>
              {pAt ? (
                <div className="mt-4 rounded-2xl bg-rose-50 p-4">
                  <p className="font-medium text-rose-600">Period recorded</p>
                  <p className="text-sm text-slate-500">
                    Started {shortDate(pAt.start)} ·{" "}
                    {pAt.end ? `ended ${shortDate(pAt.end)}` : "end date not added"}
                  </p>

                  {panelEditing ? (
                    <PeriodEditor
                      key={pAt.id}
                      period={pAt}
                      today={today}
                      onSave={(patch) => saveEdit(pAt.id, patch)}
                      onCancel={() => setPanelEditing(false)}
                    />
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setPanelEditing(true)}
                        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-rose-600 shadow-sm transition active:scale-95"
                      >
                        <Pencil size={14} /> Edit dates
                      </button>
                      {!pAt.end && selected >= pAt.start && (
                        <button
                          onClick={() => endOn(selected)}
                          className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-rose-600 shadow-sm transition active:scale-95"
                        >
                          <Check size={14} /> Ended on this day
                        </button>
                      )}
                      <DeleteButton onConfirm={() => removePeriod(pAt.id)} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => startOn(selected)}
                    className="flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 active:scale-95"
                  >
                    <Droplet size={14} /> Period started
                  </button>
                  <button
                    onClick={() => endOn(selected)}
                    disabled={!endCandidate}
                    className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 active:scale-95 disabled:opacity-40"
                  >
                    <Check size={14} /> Period ended
                  </button>
                </div>
              )}

              <p className="mb-2 mt-6 font-semibold text-slate-800">How are you feeling?</p>
              <div className="flex flex-wrap gap-2">
                {symptomList.map((s) => {
                  const level = selectedSymptoms[s.id] || 0;
                  return (
                    <button
                      key={s.id}
                      onClick={() => cycleSymptom(selected, s.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-95 ${severityStyle[level]}`}
                    >
                      <span>{s.emoji}</span>
                      {s.label}
                      {level > 0 && <span className="text-xs opacity-80">· {severityLabel[level]}</span>}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Tap a symptom to add it. Tap again to raise how strong it is (mild, moderate,
                strong), and once more to remove it. All optional.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Cycle-sync eating */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-100 text-rose-500">
            <Flower2 size={18} />
          </span>
          <h2 className="text-lg font-bold text-slate-800">Cycle-Sync Eating</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {phaseOrder.map((key, i) => {
            const info = phases[key];
            const current = phase?.key === key;
            const foods = info.foods.filter((f) => !f.a.some((x) => allergies.includes(x)));
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-3xl p-5 shadow-soft ${info.bg} ${
                  current ? "ring-2 ring-lav-400" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`font-semibold ${info.color}`}>{info.label}</p>
                  {current && (
                    <span className="rounded-full bg-white px-3 py-0.5 text-xs font-medium text-lav-600">
                      You're likely here
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{info.when}</p>
                <p className="mt-2 text-sm text-slate-600">{info.intro}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {foods.map((f) => (
                    <span
                      key={f.n}
                      className="rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-slate-600"
                    >
                      {f.n}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Food ideas for wellness awareness, not medical advice. Phases are estimates based on
          your own dates.
        </p>
      </div>

      {/* History */}
      {periods.length > 0 && (
        <div className="card">
          <p className="font-semibold text-slate-800">Period history</p>
          <p className="text-sm text-slate-400">Wrong date? Edit or delete it here.</p>

          <div className="mt-4 space-y-3">
            {[...periods].reverse().map((p) => {
              const len = lengthFor(p);
              const editing = editingId === p.id;
              return (
                <div key={p.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-[10rem]">
                      <p className="font-medium text-slate-700">
                        {shortDate(p.start)}
                        {p.end ? ` → ${shortDate(p.end)}` : ""}
                      </p>
                      <p className="text-xs text-slate-400">
                        {len ? `${len} days since the previous start` : "First recorded period"}
                        {!p.end ? " · end date not added" : ""}
                      </p>
                    </div>
                    {!editing && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setEditingId(p.id)}
                          className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-rose-600 shadow-sm transition active:scale-95"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <DeleteButton onConfirm={() => removePeriod(p.id)} />
                      </div>
                    )}
                  </div>

                  {editing && (
                    <PeriodEditor
                      key={p.id}
                      period={p}
                      today={today}
                      onSave={(patch) => saveEdit(p.id, patch)}
                      onCancel={() => setEditingId(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <AddPeriodForm today={today} onAdd={addEarlier} />

          <div className="mt-5 rounded-2xl bg-lav-50 p-4">
            <p className="font-medium text-lav-600">Cycle summary</p>
            {symptomCounts.length > 0 ? (
              <>
                <p className="mt-1 text-sm text-slate-500">
                  Symptoms you've noted most often (across {loggedDays} logged day
                  {loggedDays === 1 ? "" : "s"}):
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {symptomCounts.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600"
                    >
                      {s.emoji} {s.label} · {s.n}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                No symptoms logged yet. Tap a day on the calendar to add some.
              </p>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Days with nothing recorded just mean nothing was logged, not that nothing
              happened.
            </p>
          </div>
        </div>
      )}

      {/* Gentle guidance */}
      <div className="rounded-3xl bg-white/70 p-5 text-sm text-slate-500">
        <p className="font-semibold text-slate-700">Good to know</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {isTeen && (
            <li>
              In the first few years after periods begin, cycles are often irregular. That's
              very common.
            </li>
          )}
          <li>Estimates can be off, especially when cycles change from month to month.</li>
          <li>
            If your periods stop for 3 months or more, are very painful or very heavy, or you
            feel unwell, it's a good idea to talk to a doctor or a trusted adult.
          </li>
          <li>Bloom is for wellness awareness. It can't diagnose or treat anything.</li>
        </ul>
      </div>
    </div>
  );
}