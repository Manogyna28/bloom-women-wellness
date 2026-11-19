import { useState } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import {
  Heart,
  Home,
  Apple,
  Activity,
  CalendarHeart,
  Sparkles,
  LogOut,
  Lock,
  Settings as SettingsIcon,
  ShieldCheck,
} from "lucide-react";
import { logout, getAccount, getProfile } from "../lib/storage.js";
import { hasPin, isUnlocked, lock, requestPinReset } from "../lib/privacy.js";
import LockScreen from "./LockScreen.jsx";

export default function Layout() {
  const navigate = useNavigate();
  const account = getAccount();
  const discreet = !!getProfile()?.discreet;
  const [unlocked, setUnlocked] = useState(isUnlocked());

  const nav = [
    { to: "/app", end: true, label: "Home", icon: Home },
    { to: "/app/food", label: "Food", icon: Apple },
    { to: "/app/track", label: "Track", icon: Activity },
    { to: "/app/cycle", label: discreet ? "Calendar" : "Cycle", icon: CalendarHeart },
    { to: "/app/insights", label: "Insights", icon: Sparkles },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Quick hide: lock right now (needs a PIN, otherwise send them to set one)
  const quickHide = () => {
    if (hasPin()) {
      lock();
      setUnlocked(false);
    } else {
      navigate("/app/settings");
    }
  };

  const forgotPin = () => {
    requestPinReset();
    logout();
    navigate("/login");
  };

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} onForgot={forgotPin} />;
  }

  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-full bg-lav-50 text-lav-600 transition active:scale-90";

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-lav-100 bg-white/70 p-6 backdrop-blur md:flex print:hidden">
        <div className="flex items-center gap-2 text-2xl font-bold text-lav-600">
          <Heart className="fill-brand-400 text-brand-400" /> Bloom
        </div>

        <nav className="mt-10 flex flex-1 flex-col gap-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-lav-500 to-brand-500 text-white shadow-soft"
                    : "text-slate-500 hover:bg-lav-50 hover:text-lav-600"
                }`
              }
            >
              <n.icon size={20} /> {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="rounded-2xl bg-lav-50 p-4">
          <p className="text-sm font-semibold text-slate-700">{account?.name || "Friend"}</p>
          <div className="mt-3 flex items-center gap-2">
            <NavLink
              to="/app/settings"
              className={({ isActive }) => `${iconBtn} ${isActive ? "!bg-lav-500 !text-white" : "!bg-white"}`}
              aria-label="Settings"
              title="Settings"
            >
              <SettingsIcon size={16} />
            </NavLink>
            <button onClick={quickHide} className={`${iconBtn} !bg-white`} aria-label="Quick hide" title="Quick hide (lock)">
              <Lock size={16} />
            </button>
            <button onClick={handleLogout} className={`${iconBtn} !bg-white hover:!text-rose-500`} aria-label="Log out" title="Log out">
              <LogOut size={16} />
            </button>
          </div>
          <Link
            to="/privacy"
            className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-lav-600"
          >
            <ShieldCheck size={12} /> Privacy rules
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white/70 px-5 py-4 backdrop-blur md:hidden print:hidden">
        <div className="flex items-center gap-2 text-xl font-bold text-lav-600">
          <Heart className="fill-brand-400 text-brand-400" size={20} /> Bloom
        </div>
        <div className="flex items-center gap-2">
          <button onClick={quickHide} className={iconBtn} aria-label="Quick hide">
            <Lock size={16} />
          </button>
          <NavLink to="/app/settings" className={iconBtn} aria-label="Settings">
            <SettingsIcon size={16} />
          </NavLink>
          <button onClick={handleLogout} className={iconBtn} aria-label="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="px-5 pb-28 pt-6 md:pl-72 md:pr-8 md:pb-10 print:!p-0">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-lav-100 bg-white/90 px-2 pb-2 pt-2 backdrop-blur md:hidden print:hidden">
        <div className="mx-auto flex max-w-md justify-around">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                  isActive ? "bg-lav-100 text-lav-600" : "text-slate-400"
                }`
              }
            >
              <n.icon size={20} />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}