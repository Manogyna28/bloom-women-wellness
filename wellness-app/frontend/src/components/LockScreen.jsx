import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Delete, Lock } from "lucide-react";
import { verifyPin, unlock } from "../lib/privacy.js";

export default function LockScreen({ onUnlock, onForgot }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const press = (d) => {
    setError(false);
    setPin((p) => (p.length >= 4 ? p : p + d));
  };
  const back = () => setPin((p) => p.slice(0, -1));

  // Check the PIN as soon as 4 digits are entered
  useEffect(() => {
    if (pin.length !== 4) return;
    let cancelled = false;
    verifyPin(pin).then((ok) => {
      if (cancelled) return;
      if (ok) {
        unlock();
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setPin(""), 450);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-auto bg-gradient-to-br from-lav-100 via-white to-brand-100 px-6">
      <div className="w-full max-w-xs text-center">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-lav-600">
          <Heart className="fill-brand-400 text-brand-400" /> Bloom
        </div>
        <div className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-white text-lav-500 shadow-soft">
          <Lock />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-800">Enter your PIN</h1>
        <p className="text-sm text-slate-400">Your space is locked 💜</p>

        <motion.div
          animate={error ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 flex justify-center gap-4"
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full transition ${
                error ? "bg-rose-400" : i < pin.length ? "bg-lav-500" : "bg-lav-200"
              }`}
            />
          ))}
        </motion.div>
        <p className="mt-3 h-5 text-sm text-rose-500">{error ? "That PIN isn't right" : ""}</p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="h-16 rounded-2xl bg-white text-2xl font-semibold text-slate-700 shadow-sm transition hover:bg-lav-50 active:scale-90"
            >
              {k}
            </button>
          ))}
          <span />
          <button
            onClick={() => press("0")}
            className="h-16 rounded-2xl bg-white text-2xl font-semibold text-slate-700 shadow-sm transition hover:bg-lav-50 active:scale-90"
          >
            0
          </button>
          <button
            onClick={back}
            className="grid h-16 place-items-center rounded-2xl text-slate-400 transition hover:text-lav-600 active:scale-90"
            aria-label="Delete last digit"
          >
            <Delete />
          </button>
        </div>

        <button
          onClick={onForgot}
          className="mt-6 text-sm font-medium text-slate-400 hover:text-lav-600"
        >
          Forgot PIN? Log out to reset it
        </button>
      </div>
    </div>
  );
}