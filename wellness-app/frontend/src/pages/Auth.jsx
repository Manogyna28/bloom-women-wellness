import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  saveAccount,
  setSession,
  getProfile,
  setToken,
} from "../lib/storage.js";

import {
  signup as apiSignup,
  login as apiLogin,
} from "../lib/api.js";
import { clearPin, consumePinReset } from "../lib/privacy.js";

const ageOptions = ["Under 13", "13–17", "18–24", "25–34", "35–44", "45+"];

export default function Auth({ mode = "login" }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", age: "" });

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

 
const submit = async (e) => {
  e.preventDefault();
  setError("");

  if (isSignup) {
    if (!form.name.trim())
      return setError("Please tell us what to call you.");

    if (!form.age)
      return setError("Please select your age range.");

    if (form.age === "Under 13") {
      return setError(
        "Bloom is for ages 13 and up. Please ask a parent or guardian for help."
      );
    }
  }

if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
  return setError("Please enter a valid email address.");
}

  if (form.password.length < 6) {
    return setError("Password should be at least 6 characters.");
  }

  try {
    const result = isSignup
      ? await apiSignup({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          age: form.age,
        })
      : await apiLogin({
          email: form.email.trim(),
          password: form.password,
        });

    setToken(result.token);
    saveAccount(result.account);
    setSession(result.account.email);

    if (!isSignup && consumePinReset()) {
      clearPin();
    }

    navigate(
      isSignup || !getProfile() ? "/onboarding" : "/app"
    );
  } catch (err) {
    setError(err.message || "Unable to connect. Please try again.");
  }
};


  const inputWrap =
    "flex items-center gap-3 rounded-2xl border border-lav-100 bg-white px-4 py-3 focus-within:border-lav-400 focus-within:ring-4 focus-within:ring-lav-100 transition";
  const inputCls = "w-full bg-transparent outline-none placeholder:text-slate-300";

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left decorative panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-lav-500 via-lav-400 to-brand-400 p-12 text-white md:flex md:flex-col md:justify-between">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-10 -left-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <Link to="/" className="relative flex items-center gap-2 text-2xl font-bold">
          <Heart className="fill-white" /> Bloom
        </Link>
        <div className="relative">
          <Sparkles size={40} className="mb-6 animate-float" />
          <h2 className="text-4xl font-bold leading-tight">
            Small habits,
            <br />
            big glow-ups.
          </h2>
          <p className="mt-4 max-w-sm text-white/85">
            A calm, private space to understand your body, your moods and your
            everyday routines, at every stage of life.
          </p>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-white/80">
          <ShieldCheck size={16} /> Private by design. Wellness awareness only.
        </p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="mb-8 flex items-center gap-2 text-2xl font-bold text-lav-600 md:hidden"
          >
            <Heart className="fill-brand-400 text-brand-400" /> Bloom
          </Link>

          <h1 className="text-3xl font-bold text-slate-800">
            {isSignup ? "Create your account 🌸" : "Welcome back 💜"}
          </h1>
          <p className="mt-2 text-slate-500">
            {isSignup
              ? "It only takes a minute. We only ask for what we need."
              : "Log in to continue your wellness journey."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {isSignup && (
              <>
                <label className={inputWrap}>
                  <User size={18} className="text-lav-400" />
                  <input
                    className={inputCls}
                    placeholder="What should we call you?"
                    value={form.name}
                    onChange={update("name")}
                  />
                </label>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-500">Your age</p>
                  <div className="grid grid-cols-3 gap-2">
                    {ageOptions.map((a) => (
                      <button
                        type="button"
                        key={a}
                        onClick={() => setForm({ ...form, age: a })}
                        className={`rounded-xl border px-2 py-2 text-sm font-medium transition ${
                          form.age === a
                            ? "border-lav-500 bg-lav-500 text-white shadow-soft"
                            : "border-lav-100 bg-white text-slate-500 hover:border-lav-300"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    We use this only to tailor tips to your life stage.
                  </p>
                </div>
              </>
            )}

            <label className={inputWrap}>
              <Mail size={18} className="text-lav-400" />
              <input
                type="email"
                className={inputCls}
                placeholder="Email address"
                value={form.email}
                onChange={update("email")}
              />
            </label>

            <label className={inputWrap}>
              <Lock size={18} className="text-lav-400" />
              <input
                type={showPw ? "text" : "password"}
                className={inputCls}
                placeholder="Password"
                value={form.password}
                onChange={update("password")}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="text-slate-300 hover:text-lav-500"
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-500"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                {error}
              </motion.div>
            )}

            <button type="submit" className="btn-primary w-full">
              {isSignup ? "Create account" : "Log in"} <ArrowRight size={18} />
            </button>
          </form>

          {isSignup && (
            <p className="mt-4 text-center text-xs text-slate-400">
              By creating an account you agree to our{" "}
              <Link to="/privacy" className="font-medium text-lav-500 hover:underline">
                Privacy Rules
              </Link>
              . If you're under 18, it's a good idea to let a trusted adult know you're using
              Bloom.
            </p>
          )}

          <p className="mt-6 text-center text-slate-500">
            {isSignup ? "Already have an account?" : "New to Bloom?"}{" "}
            <Link
              to={isSignup ? "/login" : "/signup"}
              className="font-semibold text-lav-600 hover:underline"
            >
              {isSignup ? "Log in" : "Sign up"}
            </Link>
          </p>

          {!isSignup && (
            <p className="mt-3 text-center text-xs text-slate-400">
              <Link to="/privacy" className="hover:text-lav-600">
                Privacy Rules
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}