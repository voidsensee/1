// TypeScript / React / Tailwind. Блоки PENTA SPOOF #1.
import type { ReactNode } from "react";

export function ClanTag({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const glyphs = "PENTAGON";
  const s = { sm: "text-[10px] tracking-[0.5em]", md: "text-[12px] tracking-[0.55em]", lg: "text-[14px] tracking-[0.6em]" }[size];
  const tone = ["text-amber-300","text-red-400","text-amber-200","text-orange-400","text-amber-300","text-red-300","text-amber-200","text-orange-300"];
  return (
    <div className="flex items-center gap-3 select-none">
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-amber-500/70" />
      <div className={`font-black ${s}`}>
        {glyphs.split("").map((g, i) => (<span key={i} className={tone[i % tone.length]}>{g}</span>))}
      </div>
      <span className="h-px w-8 bg-gradient-to-l from-transparent to-red-500/70" />
    </div>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0">
        <defs>
          <linearGradient id="glog" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="55%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#fcd34d" />
          </linearGradient>
        </defs>
        <path d="M20 2.5L37 15l-6.5 20h-21L3 15z" fill="none" stroke="url(#glog)" strokeWidth="2" />
        <path d="M20 9.5L30.5 17.4l-4 12.4h-13l-4-12.4z" fill="url(#glog)" opacity="0.2" />
        <path d="M20 13v14M14.5 18.5h11M15.5 23h9" stroke="url(#glog)" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
      <div className="leading-none">
        <div className="text-[15px] font-black tracking-tight text-neutral-50">
          PENTA
          <span className="bg-gradient-to-r from-amber-300 to-red-400 bg-clip-text text-transparent">SPOOF</span>
          <span className="ml-1 text-[11px] font-black text-amber-400">#1</span>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, placeholder, type = "text", maxLength, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; maxLength?: number; hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-amber-600">{label}</span>
      <input
        type={type} value={value} maxLength={maxLength} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-amber-900 bg-black/60 px-3.5 py-3 text-[14px] text-neutral-100 outline-none transition placeholder:text-neutral-700 focus:border-amber-500 focus:bg-black/80"
      />
      {hint && <span className="mt-1 block text-[11px] text-neutral-600">{hint}</span>}
    </label>
  );
}

export function Btn({ children, onClick, variant = "primary", full, disabled }: {
  children: ReactNode; onClick?: () => void;
  variant?: "primary" | "ghost" | "soft" | "danger"; full?: boolean; disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[13px] font-black uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-40";
  const v = {
    primary: "bg-gradient-to-r from-amber-500 via-red-600 to-amber-600 text-black shadow-lg shadow-red-950 hover:brightness-110",
    soft: "border border-amber-800 bg-black/60 text-amber-200 hover:border-amber-500 hover:text-amber-100",
    ghost: "text-neutral-500 hover:text-amber-200",
    danger: "border border-red-800 bg-red-950 text-red-300 hover:bg-red-900",
  }[variant || "primary"];
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${v} ${full ? "w-full" : ""}`}>
      {children}
    </button>
  );
}

export function Badge({ tone, children }: { tone: "ok" | "warn" | "bad" | "idle"; children: ReactNode }) {
  const t = {
    ok: "border-amber-700 bg-amber-950 text-amber-300",
    warn: "border-orange-800 bg-orange-950 text-orange-300",
    bad: "border-red-800 bg-red-950 text-red-300",
    idle: "border-neutral-800 bg-black/50 text-neutral-400",
  }[tone || "idle"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${t}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-amber-900 bg-black/60 p-6 shadow-2xl shadow-black/60 backdrop-blur-md ${className}`}>
      {children}
    </div>
  );
}

export function Stat({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-amber-900 bg-black/50 p-4">
      <div className="text-[9.5px] font-black uppercase tracking-[0.2em] text-amber-600">{k}</div>
      <div className="mt-1.5 text-xl font-black text-amber-50">{v}</div>
      {sub && <div className="mt-0.5 text-[11px] text-neutral-500">{sub}</div>}
    </div>
  );
}

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-600" />
      <svg width="18" height="18" viewBox="0 0 20 20" className="shrink-0">
        <path d="M10 1.5l2.2 6.3H19l-5.4 3.9 2.1 6.3L10 14.1l-5.7 3.9 2.1-6.3L1 7.8h6.8z" fill="none" stroke="#d97706" strokeWidth="1.1" />
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-600" />
    </div>
  );
}
