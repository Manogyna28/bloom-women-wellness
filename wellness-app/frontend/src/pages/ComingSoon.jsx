import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function ComingSoon({ icon: Icon, title, text, tint, items }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl pt-6"
    >
      <div className="card text-center">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-3xl ${tint}`}>
          <Icon size={30} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-800">{title}</h1>
        <p className="mt-2 text-slate-500">{text}</p>

        <ul className="mt-6 space-y-3 text-left">
          {items.map((it) => (
            <li key={it} className="flex items-start gap-3 rounded-2xl bg-lav-50 p-3 text-slate-600">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lav-500 text-white">
                <Check size={12} />
              </span>
              {it}
            </li>
          ))}
        </ul>

        <p className="mt-6 inline-block rounded-full bg-brand-50 px-4 py-1 text-sm font-medium text-brand-600">
          Coming soon 🌸
        </p>
      </div>
    </motion.div>
  );
}