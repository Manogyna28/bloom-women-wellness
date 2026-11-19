import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Moon,
  Droplets,
  Footprints,
  Minus,
  Plus,
  Lock,
  EyeOff,
  Download,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Check,
} from "lucide-react";
import {
  getAccount,
  getProfile,
  getDefaultGoals,
  updateAccount,
  updateProfile,
  exportAllData,
  deleteTrackedData,
  deleteEverything,
} from "../lib/storage.js";
import { suggestGoals } from "../lib/goals.js";
import { hasPin, setPin, clearPin } from "../lib/privacy.js";

/* ---------- small components ---------- */

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        on ? "bg-lav-500" : "bg-slate-200"
      }`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function Stepper({ icon: Icon, tint, label, value, unit, step, min, max, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tint}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="font-medium text-slate-700">{label}</p>
          <p className="text-sm text-slate-400">
            {value} {unit}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="grid h-9 w-9 place-items-center rounded-full bg-lav-50 text-lav-600 transition active:scale-90"
          aria-label={`Lower ${label}`}
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="grid h-9 w-9 place-items-center rounded-full bg-lav-500 text-white transition active:scale-90"
          aria-label={`Raise ${label}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function PinSection() {
  const [on, setOn] = useState(hasPin());
  const [editing, setEditing] = useState(false);
  const [pin, setPinVal] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState("");

  const digits = (v) => v.replace(/\D/g, "").slice(0, 4);

  const save = async () => {
    if (!/^\d{4}$/.test(pin)) return setMsg("Please use exactly 4 digits.");
    if (pin !== again) return setMsg("The two PINs don't match.");
    await setPin(pin);
    setOn(true);
    setEditing(false);
    setPinVal("");
    setAgain("");
    setMsg("PIN saved. Bloom will ask for it whenever you open it in a new tab.");
  };

  const remove = () => {
    clearPin();
    setOn(false);
    setEditing(false);
    setMsg("PIN removed.");
  };

  const input =
    "w-full rounded-xl border border-lav-200 bg-white px-3 py-2 text-center tracking-[0.5em] outline-none focus:border-lav-400";

  return (
    <div>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lav-100 text-lav-500">
            <Lock size={20} />
          </div>
          <div>
            <p className="font-medium text-slate-700">App PIN lock</p>
            <p className="text-sm text-slate-400">
              {on ? "On. Use the lock button in the header for Quick hide." : "Off"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditing(!editing);
              setMsg("");
            }}
            className="rounded-full bg-lav-50 px-4 py-2 text-sm font-medium text-lav-600 transition hover:bg-lav-100"
          >
            {on ? "Change" : "Set PIN"}
          </button>
          {on && (
            <button
              onClick={remove}
              className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-500"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {editing && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 grid gap-3 rounded-2xl bg-lav-50 p-4 sm:grid-cols-2"
        >
          <input
            type="password"
            inputMode="numeric"
            placeholder="New PIN"
            value={pin}
            onChange={(e) => setPinVal(digits(e.target.value))}
            className={input}
          />
          <input
            type="password"
            inputMode="numeric"
            placeholder="Repeat PIN"
            value={again}
            onChange={(e) => setAgain(digits(e.target.value))}
            className={input}
          />
          <button onClick={save} className="btn-primary sm:col-span-2">
            Save PIN
          </button>
        </motion.div>
      )}

      {msg && <p className="mt-2 text-sm text-lav-600">{msg}</p>}
      <p className="mt-2 text-xs text-slate-400">
        This lock keeps casual snoopers out on this device. Pick a PIN you'll remember.
      </p>
    </div>
  );
}

/* ---------- page ---------- */

export default function Settings() {
  const [account, setAccountState] = useState(getAccount() || {});
  const [profile, setProfileState] = useState(getProfile() || {});
  const goals = profile.goals || getDefaultGoals(account.age);

  const [name, setName] = useState(account.name || "");
  const [weight, setWeight] = useState(profile.weightKg ? String(profile.weightKg) : "");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(null); // null | "tracked" | "account"

  const flash = (m) => {
    setNote(m);
    setTimeout(() => setNote(""), 2500);
  };

  const changeProfile = (patch) => setProfileState(updateProfile(patch));

  const w = parseFloat(weight);
  const validWeight = w >= 25 && w <= 200 ? w : null;
  const weightInvalid = weight !== "" && !validWeight;
  const suggested = suggestGoals(account.age, validWeight);

  const saveName = () => {
    if (!name.trim()) return;
    setAccountState(updateAccount({ name: name.trim() }));
    flash("Name saved");
  };

  const saveWeight = () => {
    if (weightInvalid) return;
    changeProfile({
      weightKg: validWeight,
      goals: { ...goals, water: suggested.water },
    });
    flash(validWeight ? "Weight saved and water goal updated" : "Weight removed. Water goal reset");
  };

  const resetGoals = () => {
    changeProfile({ goals: suggested });
    flash("Goals reset to suggested");
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(exportAllData(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bloom-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const wipeTracked = () => {
    deleteTrackedData();
    window.location.assign("/app");
  };

  const wipeAccount = () => {
    deleteEverything();
    window.location.assign("/");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-400">Your space, your rules.</p>
      </div>

      {note && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-600"
        >
          <Check size={16} /> {note}
        </motion.p>
      )}

      {/* About you */}
      <div className="card space-y-4">
        <p className="font-semibold text-slate-800">About you</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="min-w-0 flex-1 rounded-xl border border-lav-200 bg-white px-4 py-2 outline-none focus:border-lav-400"
          />
          <button onClick={saveName} className="rounded-full bg-lav-500 px-5 py-2 font-medium text-white transition hover:bg-lav-600 active:scale-95">
            Save
          </button>
        </div>
        <p className="text-sm text-slate-400">Age range: {account.age || "not set"}</p>
      </div>

      {/* Goals */}
      <div className="card space-y-4">
        <div>
          <p className="font-semibold text-slate-800">Daily goals</p>
          <p className="text-sm text-slate-400">
            Gentle targets, never a test. Change them any time.
          </p>
        </div>

        <div className="rounded-2xl bg-sky-50 p-4">
          <p className="font-medium text-sky-600">Your weight (optional)</p>
          <p className="mt-1 text-sm text-slate-500">
            Used only to suggest a water goal (about 33 ml per kg). Leave it empty to use the
            standard 8 glasses.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="number"
              inputMode="decimal"
              min="25"
              max="200"
              placeholder="kg"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-28 rounded-xl border border-sky-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
            />
            <span className="text-sm text-slate-500">
              Suggested water goal: <strong>{suggested.water} glasses</strong>
            </span>
            <button
              onClick={saveWeight}
              disabled={weightInvalid}
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 active:scale-95 disabled:opacity-40"
            >
              Save & update goal
            </button>
          </div>
          {weightInvalid && (
            <p className="mt-2 text-xs text-rose-500">Please enter a weight between 25 and 200 kg.</p>
          )}
        </div>

        <Stepper
          icon={Moon}
          tint="bg-indigo-100 text-indigo-500"
          label="Sleep"
          value={goals.sleep}
          unit="hours"
          step={0.5}
          min={6}
          max={11}
          onChange={(v) => changeProfile({ goals: { ...goals, sleep: v } })}
        />
        <Stepper
          icon={Droplets}
          tint="bg-sky-100 text-sky-500"
          label="Water"
          value={goals.water}
          unit="glasses"
          step={1}
          min={4}
          max={14}
          onChange={(v) => changeProfile({ goals: { ...goals, water: v } })}
        />
        <Stepper
          icon={Footprints}
          tint="bg-emerald-100 text-emerald-500"
          label="Activity"
          value={goals.activity}
          unit="min / day"
          step={5}
          min={10}
          max={120}
          onChange={(v) => changeProfile({ goals: { ...goals, activity: v } })}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            Sleep and activity start from age-group guidelines, not from weight or BMI.
          </p>
          <button
            onClick={resetGoals}
            className="text-sm font-medium text-lav-500 hover:underline"
          >
            Reset to suggested
          </button>
        </div>
      </div>

      {/* Privacy & security */}
      <div className="card space-y-4">
        <p className="flex items-center gap-2 font-semibold text-slate-800">
          <ShieldCheck size={18} className="text-lav-500" /> Privacy & security
        </p>

        <PinSection />

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lav-100 text-lav-500">
              <EyeOff size={20} />
            </div>
            <div>
              <p className="font-medium text-slate-700">Discreet mode</p>
              <p className="text-sm text-slate-400">Uses neutral words like "Calendar" instead of "Cycle".</p>
            </div>
          </div>
          <Toggle
            on={!!profile.discreet}
            onChange={(v) => {
              changeProfile({ discreet: v });
              flash(v ? "Discreet mode on" : "Discreet mode off");
            }}
          />
        </div>

        <Link to="/privacy" className="inline-block text-sm font-medium text-lav-500 hover:underline">
          Read the Privacy Rules →
        </Link>
      </div>

      {/* Your data */}
      <div className="card space-y-4">
        <div>
          <p className="font-semibold text-slate-800">Your data</p>
          <p className="text-sm text-slate-400">It's yours. Take it or delete it any time.</p>
        </div>

        <button
          onClick={download}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition hover:bg-lav-50"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-500">
            <Download size={20} />
          </span>
          <span>
            <span className="block font-medium text-slate-700">Download my data</span>
            <span className="block text-sm text-slate-400">A JSON file with everything you've entered</span>
          </span>
        </button>

        <button
          onClick={() => setConfirm("tracked")}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition hover:bg-rose-50"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-500">
            <Trash2 size={20} />
          </span>
          <span>
            <span className="block font-medium text-slate-700">Delete my tracked data</span>
            <span className="block text-sm text-slate-400">Meals, periods, symptoms and daily entries. Keeps your account.</span>
          </span>
        </button>

        <button
          onClick={() => setConfirm("account")}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition hover:bg-rose-50"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-500">
            <Trash2 size={20} />
          </span>
          <span>
            <span className="block font-medium text-slate-700">Delete my account</span>
            <span className="block text-sm text-slate-400">Removes everything and logs you out</span>
          </span>
        </button>

        {confirm && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-rose-50 p-4"
          >
            <p className="flex items-start gap-2 font-medium text-rose-600">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              {confirm === "tracked"
                ? "Delete all your tracked entries? This can't be undone."
                : "Delete your account and everything in it? This can't be undone."}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Tip: download a copy first if you might want it later.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={confirm === "tracked" ? wipeTracked : wipeAccount}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-rose-600 active:scale-95"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-500"
              >
                Keep my data
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}