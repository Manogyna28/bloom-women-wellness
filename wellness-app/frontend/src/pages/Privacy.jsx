import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  ArrowLeft,
  ShieldCheck,
  Database,
  Ban,
  Lock,
  UserCheck,
  Download,
  Info,
  EyeOff,
} from "lucide-react";

const sections = [
  {
    icon: Database,
    tint: "bg-lav-100 text-lav-500",
    title: "What Bloom stores",
    items: [
      "Your account: first name (or nickname), email and age range.",
      "Optional: your weight, only to suggest a daily water goal.",
      "Your daily entries: water, sleep, activity, mood and energy.",
      "Your meals, food style and allergies.",
      "Your period dates and symptoms, if you choose to log them.",
    ],
  },
  {
    icon: Ban,
    tint: "bg-rose-100 text-rose-500",
    title: "What Bloom never asks for",
    items: [
      "Your exact location, contacts, photos, camera or microphone.",
      "ID numbers or bank details.",
      "Your height or a BMI score. We don't need them.",
    ],
  },
  {
    icon: Lock,
    tint: "bg-sky-100 text-sky-500",
    title: "Where your data lives",
    items: [
      "In this version, your entries are saved only in your browser on this device. Nothing is sent to a server.",
      "When online accounts arrive, your password will be stored only as a secure hash, data will travel over HTTPS, and your records will be separated so only your own account can read them.",
      "We only collect what a feature needs, and every optional field can be skipped.",
    ],
  },
  {
    icon: EyeOff,
    tint: "bg-indigo-100 text-indigo-500",
    title: "Who can see it",
    items: [
      "Only you. We don't share your entries with parents, schools, other users or anyone else.",
      "No ads, and we never sell your data.",
      "The Doctor-Ready Summary is made only when you ask, and you choose what goes in it. It's created on your device.",
    ],
  },
  {
    icon: Download,
    tint: "bg-emerald-100 text-emerald-500",
    title: "Your controls",
    items: [
      "Download everything you've entered, any time (Settings).",
      "Delete your tracked data, or your whole account, any time (Settings).",
      "Edit or delete any single entry, including period dates.",
      "Turn on a PIN lock and use Quick hide to cover the screen fast.",
      "Turn on Discreet mode for neutral wording.",
    ],
  },
  {
    icon: UserCheck,
    tint: "bg-amber-100 text-amber-500",
    title: "Age",
    items: [
      "Bloom is for ages 13 and up.",
      "If you're under 18, it's a good idea to let a parent, guardian or another trusted adult know you're using it. You never have to share what you log.",
    ],
  },
  {
    icon: Info,
    tint: "bg-slate-100 text-slate-500",
    title: "Not medical advice",
    items: [
      "Bloom is for wellness awareness. It can't diagnose, treat or replace a doctor.",
      "Period estimates, food ideas and tips are general and can be wrong for you.",
      "If something worries you, please talk to a doctor or a trusted adult.",
    ],
  },
];

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-lav-600">
          <Heart className="fill-brand-400 text-brand-400" size={22} /> Bloom
        </Link>
        <button onClick={() => navigate(-1)} className="btn-ghost !px-4 !py-2">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="card mt-8">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-lav-500 to-brand-500 text-white">
          <ShieldCheck />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-slate-800">Privacy Rules</h1>
        <p className="mt-2 text-slate-500">
          The short version: <strong>your data is yours.</strong> We collect as little as
          possible, we never sell it or show ads, and you can download or delete everything
          whenever you like.
        </p>
        <p className="mt-3 text-xs text-slate-400">Last updated: October 2026</p>
      </div>

      <div className="mt-6 space-y-4">
        {sections.map((s) => (
          <div key={s.title} className="card !p-5">
            <div className="flex items-center gap-3">
              <div className={`grid h-11 w-11 place-items-center rounded-2xl ${s.tint}`}>
                <s.icon size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">{s.title}</h2>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600">
              {s.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-slate-400">
        We may update these rules as Bloom grows, and we'll always keep this page current.
      </p>
    </div>
  );
}