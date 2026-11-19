import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sunrise,
  Sun,
  Cookie,
  UtensilsCrossed,
  Plus,
  Minus,
  X,
  Search,
  Droplet,
  AlertTriangle,
  Check,
} from "lucide-react";
import { foods, foodById, categories, dietAllowed } from "../data/foods.js";
import {
  MEAL_TYPES,
  getAccount,
  getProfile,
  getMeals,
  addMealEntry,
  removeMealEntry,
  setMealSkipped,
  getRecentFoodIds,
} from "../lib/storage.js";
import { getMealsApi, saveMealsApi } from "../lib/api";
import { getToken } from "../lib/storage.js";

/* ---------- helpers ---------- */

const mealMeta = [
  { id: "breakfast", label: "Breakfast", icon: Sunrise, tint: "bg-amber-100 text-amber-500" },
  { id: "lunch", label: "Lunch", icon: Sun, tint: "bg-orange-100 text-orange-500" },
  { id: "snacks", label: "Snacks", icon: Cookie, tint: "bg-pink-100 text-pink-500" },
  { id: "dinner", label: "Dinner", icon: UtensilsCrossed, tint: "bg-indigo-100 text-indigo-500" },
];

const zero = { protein: 0, carbs: 0, fat: 0, iron: 0 };

const nutrientsOf = (entry) => {
  const f = foodById[entry.foodId];
  if (!f) return zero;
  const s = entry.servings;
  return {
    protein: f.protein * s,
    carbs: f.carbs * s,
    fat: f.fat * s,
    iron: f.iron * s,
  };
};

const sumNutrients = (list) =>
  list.reduce(
    (a, n) => ({
      protein: a.protein + n.protein,
      carbs: a.carbs + n.carbs,
      fat: a.fat + n.fat,
      iron: a.iron + n.iron,
    }),
    zero
  );

const round1 = (n) => Math.round(n * 10) / 10;

/* ---------- Add food modal ---------- */

function AddFoodModal({ meal, profile, onAdd, onClose }) {
  const allergies = profile.allergies || [];
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState(null);
  const [servings, setServings] = useState(1);

  const hasDietFilter = profile.diet && profile.diet !== "non-vegetarian";

  const visible = (f) => showAll || dietAllowed(profile.diet, f.diet);

  const recent = useMemo(
    () =>
      getRecentFoodIds(8)
        .map((id) => foodById[id])
        .filter((f) => f && visible(f)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showAll]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return foods.filter(
      (f) =>
        visible(f) &&
        (cat === "All" || f.category === cat) &&
        (!q || f.name.toLowerCase().includes(q) || f.alt.toLowerCase().includes(q))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, cat, showAll]);

  const pick = (f) => {
    setSelected(f);
    setServings(1);
  };

  const allergyHits = selected ? selected.allergens.filter((a) => allergies.includes(a)) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-xl font-bold text-slate-800">Add to {meal.label.toLowerCase()}</h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <label className="flex items-center gap-3 rounded-2xl border border-lav-100 bg-lav-50/50 px-4 py-3 focus-within:border-lav-400 focus-within:ring-4 focus-within:ring-lav-100">
            <Search size={18} className="text-lav-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search idli, dal, roti, chaas..."
              className="w-full bg-transparent outline-none placeholder:text-slate-300"
            />
          </label>

          <div className="no-scrollbar -mx-6 mt-3 flex gap-2 overflow-x-auto px-6 pb-1">
            {["All", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  cat === c
                    ? "bg-lav-500 text-white"
                    : "bg-slate-50 text-slate-500 hover:bg-lav-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {hasDietFilter && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 text-xs font-medium text-lav-500 hover:underline"
            >
              {showAll ? "Show only foods that match my diet" : "Show all foods"}
            </button>
          )}
        </div>

        {/* List */}
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto px-6 pb-4">
          {!query && cat === "All" && recent.length > 0 && (
            <div className="pb-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Recent
              </p>
              <div className="flex flex-wrap gap-2">
                {recent.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => pick(f)}
                    className="rounded-full bg-lav-50 px-3 py-1 text-sm font-medium text-lav-600 transition hover:bg-lav-100"
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && (
            <p className="py-8 text-center text-slate-400">
              No foods found. Try another name or category.
            </p>
          )}

          {results.map((f) => {
            const active = selected?.id === f.id;
            return (
              <button
                key={f.id}
                onClick={() => pick(f)}
                className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition ${
                  active
                    ? "border-lav-500 bg-lav-50"
                    : "border-transparent bg-slate-50 hover:border-lav-200"
                }`}
              >
                <div>
                  <p className="font-medium text-slate-800">{f.name}</p>
                  <p className="text-xs text-slate-400">{f.serving}</p>
                </div>
                {f.iron >= 1.5 && (
                  <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-500">
                    <Droplet size={12} /> Iron
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="shrink-0 border-t border-lav-100 bg-white"
            >
              <div className="space-y-3 px-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{selected.name}</p>
                    <p className="text-sm text-slate-400">
                      {servings} × {selected.serving}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                      className="grid h-9 w-9 place-items-center rounded-full bg-lav-50 text-lav-600 transition active:scale-90"
                      aria-label="Fewer servings"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-semibold text-slate-700">{servings}</span>
                    <button
                      onClick={() => setServings(Math.min(10, servings + 0.5))}
                      className="grid h-9 w-9 place-items-center rounded-full bg-lav-500 text-white transition active:scale-90"
                      aria-label="More servings"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {allergyHits.length > 0 && (
                  <p className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-500">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    May contain {allergyHits.join(", ").toLowerCase()}, which you listed as an
                    allergy.
                  </p>
                )}

                <button
                  onClick={() => onAdd(selected.id, servings)}
                  className="btn-primary w-full"
                >
                  <Check size={18} /> Add to {meal.label.toLowerCase()}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ---------- page ---------- */

export default function Food() {
  const account = getAccount();
  const profile = getProfile() || {};
  const allergies = profile.allergies || [];

  const [day, setDay] = useState(getMeals());
const [openMeal, setOpenMeal] = useState(null);
const [mealsLoaded, setMealsLoaded] = useState(false);

useEffect(() => {
  const loadMeals = async () => {
    const token = getToken();

    if (!token) {
      setMealsLoaded(true);
      return;
    }

    try {
      const allMeals = await getMealsApi(token);
      const todayMeals = allMeals[new Date().toLocaleDateString("en-CA")];

      if (todayMeals) {
        setDay({
          ...getMeals(),
          ...todayMeals,
          skipped: todayMeals.skipped || {},
        });
      }
    } catch (error) {
      console.error("Failed to load meals:", error);
    } finally {
      setMealsLoaded(true);
    }
  };

  loadMeals();
}, []);

  const allEntries = MEAL_TYPES.flatMap((m) => day[m]);
  const totals = sumNutrients(allEntries.map(nutrientsOf));

  // Share of each macro, just for the visual bar
  const pk = totals.protein * 4;
  const ck = totals.carbs * 4;
  const fk = totals.fat * 9;
  const macroSum = pk + ck + fk;
  const share = (v) => (macroSum ? (v / macroSum) * 100 : 0);

  // Iron: general reference only (not medical advice)
  const ironRef = account?.age === "13–17" ? 15 : 18;
  const ironPct = Math.min(totals.iron / ironRef, 1);

  const loggedIds = new Set(allEntries.map((e) => e.foodId));
  const ironTips = foods
    .filter(
      (f) =>
        f.iron >= 1.5 &&
        !loggedIds.has(f.id) &&
        dietAllowed(profile.diet, f.diet) &&
        !f.allergens.some((a) => allergies.includes(a))
    )
    .sort((a, b) => b.iron - a.iron)
    .slice(0, 5);

 const saveMealsToBackend = async (updatedDay) => {
  const token = getToken();
  if (!token) return;

  try {
    await saveMealsApi(
      token,
      new Date().toLocaleDateString("en-CA"),
      updatedDay
    );
  } catch (error) {
    console.error("Failed to save meals:", error);
    alert("Could not save meals. Please try again.");
  }
};

const handleAdd = (foodId, servings) => {
  const updatedDay = addMealEntry(openMeal.id, foodId, servings);
  setDay(updatedDay);
  saveMealsToBackend(updatedDay);
  setOpenMeal(null);
};
const handleRemove = (mealId, entryId) => {
  const updatedDay = removeMealEntry(mealId, entryId);
  setDay(updatedDay);
  saveMealsToBackend(updatedDay);
};

const handleSkip = (mealId, skipped) => {
  const updatedDay = setMealSkipped(mealId, skipped);
  setDay(updatedDay);
  saveMealsToBackend(updatedDay);
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Food</h1>
        <p className="text-slate-400">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="text-sm font-medium text-slate-400">Today's plate balance</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {allEntries.length === 0
              ? "Nothing logged yet"
              : `${allEntries.length} item${allEntries.length === 1 ? "" : "s"} logged`}
          </p>

          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="bg-rose-400 transition-all" style={{ width: `${share(pk)}%` }} />
            <div className="bg-amber-400 transition-all" style={{ width: `${share(ck)}%` }} />
            <div className="bg-sky-400 transition-all" style={{ width: `${share(fk)}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 text-center text-sm">
            <div>
              <p className="font-semibold text-rose-500">{round1(totals.protein)} g</p>
              <p className="text-slate-400">Protein</p>
            </div>
            <div>
              <p className="font-semibold text-amber-500">{round1(totals.carbs)} g</p>
              <p className="text-slate-400">Carbs</p>
            </div>
            <div>
              <p className="font-semibold text-sky-500">{round1(totals.fat)} g</p>
              <p className="text-slate-400">Fat</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            No targets here. This is just to help you notice what your meals are made of. Every
            body needs regular, nourishing meals.
          </p>
        </div>

        {/* Iron Boost */}
        <div className="card">
          <p className="flex items-center gap-2 font-semibold text-slate-800">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-100 text-red-500">
              <Droplet size={18} />
            </span>
            Iron Boost
          </p>
          <p className="mt-3 text-sm text-slate-500">
            ~{round1(totals.iron)} mg logged today · general reference about {ironRef} mg/day
          </p>
          <div className="mt-2 h-2.5 rounded-full bg-red-50">
            <motion.div
              className="h-2.5 rounded-full bg-gradient-to-r from-red-300 to-red-500"
              initial={false}
              animate={{ width: `${ironPct * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>

          {ironTips.length > 0 && (
            <>
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Iron-rich ideas for today
              </p>
              <div className="flex flex-wrap gap-2">
                {ironTips.map((f) => (
                  <span
                    key={f.id}
                    className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-500"
                  >
                    {f.name}
                  </span>
                ))}
              </div>
            </>
          )}
          <p className="mt-4 text-xs text-slate-400">
            Tip: a squeeze of lemon, amla or citrus fruit with iron-rich meals helps absorption,
            and tea or coffee right after meals can reduce it. Awareness only, not medical advice.
            If you often feel very tired or dizzy, a doctor can check.
          </p>
        </div>
      </div>

      {/* Meals */}
      <div className="grid gap-4 md:grid-cols-2">
        {mealMeta.map((m) => {
          const entries = day[m.id];
          const skipped = day.skipped?.[m.id];

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`grid h-11 w-11 place-items-center rounded-2xl ${m.tint}`}>
                    <m.icon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{m.label}</p>
                    <p className="text-xs text-slate-400">
                      {entries.length > 0
                        ? `${entries.length} item${entries.length === 1 ? "" : "s"}`
                        : "Nothing logged"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenMeal(m)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-lav-500 text-white shadow-soft transition hover:bg-lav-600 active:scale-90"
                  aria-label={`Add food to ${m.label}`}
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {entries.map((e) => {
                  const f = foodById[e.foodId];
                  if (!f) return null;
                  return (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-slate-700">{f.name}</p>
                        <p className="text-xs text-slate-400">
                          {e.servings} × {f.serving}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(m.id, e.id)}
                        className="grid h-8 w-8 place-items-center rounded-full text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                        aria-label={`Remove ${f.name}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}

                {entries.length === 0 && !skipped && (
                  <button
                    onClick={() => setOpenMeal(m)}
                    className="w-full rounded-2xl border-2 border-dashed border-lav-200 py-4 text-sm font-medium text-lav-500 transition hover:bg-lav-50"
                  >
                    + Add what you ate
                  </button>
                )}

                {skipped && entries.length === 0 && (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Marked as skipped. That's okay 💜
                  </p>
                )}
              </div>

              {entries.length === 0 && (
                <button
                  onClick={() => handleSkip(m.id, !skipped)}
                  className="mt-3 text-sm font-medium text-slate-400 hover:text-lav-600"
                >
                  {skipped ? "Undo skipped" : "I skipped this meal"}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        Nutrition values are approximate and for wellness awareness only.
      </p>

      {/* Add-food modal */}
      <AnimatePresence>
        {openMeal && (
          <AddFoodModal
            key={openMeal.id}
            meal={openMeal}
            profile={profile}
            onAdd={handleAdd}
            onClose={() => setOpenMeal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}