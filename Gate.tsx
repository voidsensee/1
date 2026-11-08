// TypeScript / React / Tailwind. Gate: активация 24-симв ключа, 6 групп по 4, привязка HWID.
import { useEffect, useRef, useState } from "react";
import { Logo, Btn, Card, Badge } from "../components/ui";
import { useSession } from "../lib/session";
import { navigate } from "../lib/router";
import { validKey } from "../lib/supabase";

const GROUPS = 6;

export default function Gate() {
  const { profile, hwid, activate, loading } = useSession();
  const [cells, setCells] = useState<string[]>(Array(GROUPS).fill(""));
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const key = cells.join("");
  const ready = validKey(key);

  const setGroup = (i: number, raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length > 4) {
      // вставка целого ключа — раскидываем по группам
      const flat = clean.slice(0, 24);
      const next = Array(GROUPS).fill("");
      for (let g = 0; g < GROUPS; ++g) next[g] = flat.slice(g * 4, g * 4 + 4);
      setCells(next);
      refs.current[Math.min(GROUPS - 1, Math.floor(flat.length / 4))]?.focus();
      return;
    }
    const next = [...cells];
    next[i] = clean;
    setCells(next);
    if (clean.length === 4 && i < GROUPS - 1) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !cells[i] && i > 0) {
      refs.current[i - 1]?.focus();
      const next = [...cells];
      next[i - 1] = "";
      setCells(next);
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < GROUPS - 1) refs.current[i + 1]?.focus();
  };

  const submit = async () => {
    setErr(null);
    setOk(null);
    const e = await activate(key);
    if (e) setErr(e);
    else {
      setOk("ключ активирован, HWID привязан");
      setTimeout(() => navigate("/dash"), 700);
    }
  };

  if (profile?.role === "admin") navigate("/admin");

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,211,238,0.14),transparent_55%),radial-gradient(ellipse_at_20%_100%,rgba(139,92,246,0.16),transparent_55%)]" />
      <Card className="relative w-full max-w-[540px]">
        <div className="mb-5 flex items-center justify-between">
          <Logo />
          <Badge tone={profile?.plan === "lifetime" ? "ok" : "warn"}>
            {profile?.plan ?? "нет плана"}
          </Badge>
        </div>

        <div className="text-center">
          <div className="text-[17px] font-bold text-neutral-50">активация доступа</div>
          <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-neutral-500">
            Введи 24-символьный ключ — латиница и цифры. Ключ привязывается к HWID с первого входа.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {cells.map((c, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={c}
              inputMode="text"
              spellCheck={false}
              onChange={(e) => setGroup(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              className="h-12 w-[52px] rounded-lg border border-neutral-800 bg-neutral-900/80 text-center font-mono text-[17px] font-bold uppercase tracking-wider text-cyan-300 outline-none transition placeholder:text-neutral-700 focus:border-violet-500/80 focus:bg-neutral-900"
              placeholder="----"
            />
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-neutral-800/80 bg-black/30 px-3.5 py-2.5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-neutral-600">
            <span>HWID</span>
            <span>{ready ? "24/24 символа" : `${key.length}/24`}</span>
          </div>
          <div className="mt-1 font-mono text-[12px] text-cyan-300">{hwid || "…"}</div>
        </div>

        {err && (
          <div className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3.5 py-2.5 text-[12.5px] text-red-300">
            {err}
          </div>
        )}
        {ok && (
          <div className="mt-4 rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-3.5 py-2.5 text-[12.5px] text-emerald-300">
            {ok}
          </div>
        )}

        <div className="mt-5 space-y-2.5">
          <Btn full onClick={submit} disabled={!ready || loading}>
            {loading ? "…" : "активировать ключ"}
          </Btn>
          <div className="text-center text-[11.5px] text-neutral-600">
            <button onClick={() => navigate("/dash")} className="hover:text-neutral-400">
              пропустить → в кабинет
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
