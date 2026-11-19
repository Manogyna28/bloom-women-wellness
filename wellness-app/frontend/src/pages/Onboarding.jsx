import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Droplets,
  Footprints,
  Leaf,
  Egg,
  Drumstick,
  Sprout,
  Apple,
  CalendarHeart,
  Smile,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  Heart,
} from "lucide-react";
import { saveProfile, getAccount, getDefaultGoals } from "../lib/storage.js";

const focusOptions = [
  { id: "cycle", label: "Period & cycle", icon: CalendarHeart, tint: "bg-rose-100 text-rose-500" },
  { id: "food", label: "Eating well", icon: Apple, tint: "bg-orange-100 text-orange-500" },
  { id: "sleep", label: "Better sleep", icon: Moon, tint: "bg-indigo-100 text-indigo-500" },
  { id: "mood", label: "Stress & mood", icon: Smile, tint: "bg-amber-100 text-amber-500" },
  { id: "activity", label: "Staying active", icon: Footprints, tint: "bg-emerald-100 text-emerald-500" },
  { id: "water", label: "Hydration", icon: Droplets, tint: "bg-sky-100 text-sky-500" },
];

const dietOptions = [
  { id: "vegetarian", label: "Vegetarian", icon: Leaf },
  { id: "eggetarian", label: "Eggetarian", icon: Egg },
  { id: "non-vegetarian", label: "Non-vegetarian", icon: Drumstick },
  { id: "vegan", label: "Vegan", icon: Sprout },
];

const allergyOptions = [
  "Peanuts",
  "Dairy",
  "Gluten",
  "Eggs",
  "Seafood",
  "Soy",
  "Tree nuts",
  "Sesame",
];

const stepsMeta = [
  { title: "What brings you here?", sub: "Pick anything you like. You can change this anytime." },
  { title: "Your food style", sub: "So our Indian meal ideas fit you." },
  { title: "Comfort & privacy", sub: "Your space, your rules." },
];

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

function SwitchRow({ icon: Icon, tint, title, text, on, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tint}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="font-medium text-slate-700">{title}</p>
          {text && <p className="text-sm text-slate-400">{text}</p>}
        </div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [focus, setFocus] = useState([]);
  const [diet, setDiet] = useState("");
  const [allergies, setAllergies] = useState([]);
  const [discreet, setDiscreet] = useState(false);
  const [reminders, setReminders] = useState({
    water: true,
    meals: true,
    sleep: true,
    period: true,
  });

  const toggleFrom = (list, setList, item) =>
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const finish = () => {
    const account = getAccount();
    saveProfile({
      focus,
      diet,
      allergies,
      discreet,
      reminders,
      // Smart defaults by age range. Editable later in Settings.
      goals: getDefaultGoals(account?.age),
    });
    navigate("/app");
  };

  const next = () => (step < 2 ? setStep(step + 1) : finish());

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-8">
      <div className="flex items-center gap-2 text-xl font-bold text-lav-600">
        <Heart className="fill-brand-400 text-brand-400" size={22} /> Bloom
      </div>

      {/* Progress */}
      <div className="mt-8 flex items-center gap-2">
        {stepsMeta.map((_, i) => (
          <div key={i} className="h-2 flex-1 overflow-hidden rounded-full bg-lav-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-lav-500 to-brand-500"
              initial={false}
              animate={{ width: i <= step ? "100%" : "0%" }}
              transition={{ duration: 0.4 }}
            />
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-lav-500">
        Step {step + 1} of {stepsMeta.length}
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-800">{stepsMeta[step].title}</h1>
      <p className="text-slate-500">{stepsMeta[step].sub}</p>

      {/* Step content */}
      <div className="mt-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {step === 0 && (
              <div className="grid grid-cols-2 gap-3">
                {focusOptions.map((f) => {
                  const active = focus.includes(f.id);
                  return (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => toggleFrom(focus, setFocus, f.id)}
                      className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 font-medium transition ${
                        active
                          ? "border-lav-500 bg-lav-50 text-lav-600 shadow-soft"
                          : "border-transparent bg-white text-slate-600 hover:border-lav-200"
                      }`}
                    >
                      {active && (
                        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-lav-500 text-white">
                          <Check size={12} />
                        </span>
                      )}
                      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${f.tint}`}>
                        <f.icon />
                      </span>
                      {f.label}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {dietOptions.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => setDiet(d.id)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 font-medium transition ${
                        diet === d.id
                          ? "border-lav-500 bg-lav-50 text-lav-600 shadow-soft"
                          : "border-transparent bg-white text-slate-500 hover:border-lav-200"
                      }`}
                    >
                      <d.icon />
                      {d.label}
                    </button>
                  ))}
                </div>

                <div>
                  <p className="mb-2 mt-2 font-semibold text-slate-700">
                    Any allergies? <span className="font-normal text-slate-400">(optional)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allergyOptions.map((a) => {
                      const active = allergies.includes(a);
                      return (
                        <button
                          type="button"
                          key={a}
                          onClick={() => toggleFrom(allergies, setAllergies, a)}
                          className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                            active
                              ? "bg-brand-500 text-white shadow-soft"
                              : "bg-white text-slate-500 hover:bg-brand-50"
                          }`}
                        >
                          {active && <Check size={14} />}
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <SwitchRow
                  icon={EyeOff}
                  tint="bg-lav-100 text-lav-500"
                  title="Discreet mode"
                  text="Neutral notification text and a quick-hide button."
                  on={discreet}
                  onChange={setDiscreet}
                />

                <p className="pt-2 text-sm font-semibold text-slate-500">Gentle reminders</p>
                <SwitchRow
                  icon={Droplets}
                  tint="bg-sky-100 text-sky-500"
                  title="Water"
                  on={reminders.water}
                  onChange={(v) => setReminders({ ...reminders, water: v })}
                />
                <SwitchRow
                  icon={Apple}
                  tint="bg-orange-100 text-orange-500"
                  title="Meals"
                  on={reminders.meals}
                  onChange={(v) => setReminders({ ...reminders, meals: v })}
                />
                <SwitchRow
                  icon={Moon}
                  tint="bg-indigo-100 text-indigo-500"
                  title="Bedtime"
                  on={reminders.sleep}
                  onChange={(v) => setReminders({ ...reminders, sleep: v })}
                />
                <SwitchRow
                  icon={CalendarHeart}
                  tint="bg-rose-100 text-rose-500"
                  title="Period estimate heads-up"
                  on={reminders.period}
                  onChange={(v) => setReminders({ ...reminders, period: v })}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="btn-ghost">
            <ArrowLeft size={18} /> Back
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="px-2 font-medium text-slate-400 hover:text-lav-600"
          >
            Skip all
          </button>
        )}
        <button type="button" onClick={next} className="btn-primary">
          {step === 2 ? "Enter Bloom" : "Continue"} <ArrowRight size={18} />
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        Everything here is optional and can be changed later in Settings.
      </p>
    </div>
  );
}