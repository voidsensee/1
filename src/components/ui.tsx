// TypeScript / React / Tailwind. Общие блоки: логотип, поле, кнопка, бейдж, карточка.
import type { ReactNode } from "react";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
        <defs>
          <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path d="M16 1.5l12.5 7v15L16 30.5 3.5 23.5v-15z" fill="none" stroke="url(#pg)" strokeWidth="1.7" />
        <path d="M16 7.5l7.4 4.2v8.6L16 24.5l-7.4-4.2v-8.6z" fill="url(#pg)" opacity="0.18" />
        <path d="M12.4 12h7.2M12.4 16h7.2M12.4 20h4.4" stroke="url(#pg)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <div className="leading-none">
        <div className="text-[15px] font-bold tracking-tight text-neutral-50">
          penta<span className="text-violet-400">spoof</span>
        </div>
        <div className="mt-0.5 text-[9px] uppercase tracking-[0.28em] text-neutral-500">identity layer</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  mono,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  mono?: boolean;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10.5px] uppercase tracking-[0.16em] text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-neutral-800 bg-neutral-900/70 px-3.5 py-2.5 text-[13.5px] text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-violet-500/70 focus:bg-neutral-900 disabled:opacity-50 ${
          mono ? "font-mono tracking-widest" : ""
        }`}
      />
      {hint && <span className="mt-1 block text-[11px] text-neutral-600">{hint}</span>}
    </label>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  full,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "soft";
  full?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";
  const v = {
    primary:
      "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-900/30 hover:brightness-110",
    soft: "border border-neutral-800 bg-neutral-900/70 text-neutral-200 hover:border-violet-500/50 hover:text-white",
    ghost: "text-neutral-400 hover:text-neutral-100",
    danger: "border border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-900/40",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${v} ${full ? "w-full" : ""}`}>
      {children}
    </button>
  );
}

export function Badge({ tone, children }: { tone: "ok" | "warn" | "bad" | "idle"; children: ReactNode }) {
  const t = {
    ok: "border-emerald-800/70 bg-emerald-950/50 text-emerald-300",
    warn: "border-amber-800/70 bg-amber-950/50 text-amber-300",
    bad: "border-red-900/70 bg-red-950/50 text-red-300",
    idle: "border-neutral-800 bg-neutral-900/60 text-neutral-400",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium ${t}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Stat({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">{k}</div>
      <div className="mt-1.5 text-xl font-bold text-neutral-50">{v}</div>
      {sub && <div className="mt-0.5 text-[11px] text-neutral-500">{sub}</div>}
    </div>
  );
}
