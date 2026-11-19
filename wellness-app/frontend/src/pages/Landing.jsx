import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Moon,
  Droplets,
  Smile,
  Apple,
  CalendarHeart,
  Sparkles,
  ShieldCheck,
  Flower2,
  Droplet,
  EyeOff,
  FileHeart,
} from "lucide-react";

const features = [
  { icon: Apple, title: "Nourish", text: "Log Indian meals easily and get balanced ideas.", color: "bg-orange-100 text-orange-500" },
  { icon: Moon, title: "Sleep", text: "See your rest patterns and build a routine.", color: "bg-indigo-100 text-indigo-500" },
  { icon: Droplets, title: "Hydrate", text: "Tap to log water and watch your progress.", color: "bg-sky-100 text-sky-500" },
  { icon: CalendarHeart, title: "Cycle", text: "Track periods and symptoms privately.", color: "bg-rose-100 text-rose-500" },
  { icon: Smile, title: "Mood", text: "Check in with your feelings and stress.", color: "bg-amber-100 text-amber-500" },
  { icon: Sparkles, title: "Insights", text: "Gentle, explainable tips made for you.", color: "bg-lav-100 text-lav-500" },
];

const unique = [
  { icon: Flower2, title: "Cycle-Sync Eating", text: "Indian food ideas that change with your cycle phase: ragi, til, methi, dates and more.", color: "bg-rose-100 text-rose-500" },
  { icon: Droplet, title: "Iron Boost", text: "Spot iron-rich foods in your day and get gentle awareness tips.", color: "bg-red-100 text-red-500" },
  { icon: EyeOff, title: "Discreet Mode", text: "Neutral notifications and a quick-hide button for total privacy.", color: "bg-lav-100 text-lav-500" },
  { icon: FileHeart, title: "Doctor-Ready Summary", text: "One clear page of your cycle and symptoms to share with a doctor.", color: "bg-emerald-100 text-emerald-500" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
};

function FeatureGrid({ items, cols = "lg:grid-cols-3" }) {
  return (
    <div className={`mt-10 grid gap-6 sm:grid-cols-2 ${cols}`}>
      {items.map((f, i) => (
        <motion.div
          key={f.title}
          custom={i}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          whileHover={{ y: -6 }}
          className="card"
        >
          <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${f.color}`}>
            <f.icon />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">{f.title}</h3>
          <p className="mt-1 text-slate-500">{f.text}</p>
        </motion.div>
      ))}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-lav-200/60 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-32 h-96 w-96 rounded-full bg-brand-200/60 blur-3xl" />

      {/* Navbar */}
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-2xl font-bold text-lav-600">
          <Heart className="fill-brand-400 text-brand-400" /> Bloom
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-ghost">Log in</Link>
          <Link to="/signup" className="btn-primary hidden sm:inline-flex">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-10 md:grid-cols-2">
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-sm font-medium text-lav-600 shadow-soft">
            <Sparkles size={16} /> For every girl & woman, at every stage
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-800 md:text-6xl">
            Feel good,
            <span className="bg-gradient-to-r from-lav-500 to-brand-500 bg-clip-text text-transparent">
              {" "}every single day
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-slate-500">
            Track food, sleep, water, mood and your cycle in one calm, private
            space, with Indian food ideas and tips that actually make sense.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/signup" className="btn-primary">Start your journey</Link>
            <a href="#features" className="btn-ghost">See how it works</a>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck size={16} className="text-lav-500" />
            Your data stays private. For wellness awareness, not diagnosis.
          </p>
        </motion.div>

        {/* Hero card mock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto w-full max-w-sm animate-float"
        >
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Good morning</p>
                <p className="text-xl font-semibold text-slate-800">Hi, there 🌸</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-lav-400 to-brand-400 text-white">
                <Smile />
              </div>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <div className="flex items-center justify-between text-sm font-medium text-sky-600">
                <span className="flex items-center gap-2"><Droplets size={16} /> Water</span>
                <span>5 / 8 glasses</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-sky-100">
                <div className="h-2 w-[62%] rounded-full bg-sky-400" />
              </div>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-4">
              <div className="flex items-center justify-between text-sm font-medium text-indigo-600">
                <span className="flex items-center gap-2"><Moon size={16} /> Sleep</span>
                <span>7h 30m</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-indigo-100">
                <div className="h-2 w-[85%] rounded-full bg-indigo-400" />
              </div>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-600">
              <span className="flex items-center gap-2">
                <CalendarHeart size={16} /> Next period (estimate): in 9 days
              </span>
            </div>
            <div className="rounded-2xl bg-lav-50 p-4 text-sm font-medium text-lav-600">
              <span className="flex items-center gap-2">
                <Flower2 size={16} /> Today's cycle-sync tip: add ragi & til
              </span>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Everyday tracking */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl scroll-mt-6 px-6 pb-20">
        <h2 className="text-center text-3xl font-bold text-slate-800">
          Everything you need, gently
        </h2>
        <FeatureGrid items={features} />
      </section>

      {/* Unique features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-sm font-medium text-brand-600 shadow-soft">
            <Sparkles size={16} /> Only in Bloom
          </span>
          <h2 className="mt-4 text-3xl font-bold text-slate-800">
            Made with Indian girls & women in mind
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-500">
            Thoughtful extras you won't find in a generic tracker.
          </p>
        </div>
        <FeatureGrid items={unique} cols="lg:grid-cols-4" />
      </section>
    </div>
  );
}