// TypeScript / React / Tailwind. Активация ключа PENTA SPOOF #1.
import { useEffect, useRef, useState } from "react";
import { Logo, Btn, Card, ClanTag } from "../components/ui";
import { useSession } from "../lib/session";
import { navigate } from "../lib/router";
import { validKey } from "../lib/supabase";

const GROUPS = 6;

export default function Gate() {
  const { profile, activate, loading } = useSession();
  const [cells, setCells] = useState<string[]>(Array(GROUPS).fill(""));
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const key = cells.join("");
  const ready = validKey(key);

  const setGroup = (i: number, raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length > 4) {
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
    setErr(null); setOk(null);
    const e = await activate(key);
    if (e) setErr(e);
    else { setOk("доступ открыт"); setTimeout(() => navigate("/dash"), 600); }
  };

  if (profile?.role === "admin") navigate("/admin");

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5">
      <div className="relative w-full max-w-[520px]">
        <div className="mb-5 flex justify-center"><ClanTag size="sm" /></div>
        <Card>
          <div className="flex flex-col items-center gap-4">
            <Logo size={34} />
            <div className="text-center">
              <div className="text-[15px] font-black uppercase tracking-wider text-neutral-50">активация</div>
              <div className="mt-1 text-[12px] text-neutral-400">введи ключ из 24 символов</div>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {cells.map((c, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                value={c}
                spellCheck={false}
                onChange={(e) => setGroup(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                maxLength={4}
                className="w-[52px] rounded-lg border border-amber-900 bg-black/70 py-3 text-center font-mono text-[18px] font-black uppercase tracking-wider text-amber-300 outline-none transition focus:border-amber-500 focus:bg-black/90"
              />
            ))}
          </div>
          {err && (
            <div className="mt-5 rounded-lg border border-red-800 bg-red-950 px-3.5 py-2.5 text-center text-[12.5px] text-red-300">
              {err}
            </div>
          )}
          {ok && (
            <div className="mt-5 rounded-lg border border-amber-700 bg-amber-950 px-3.5 py-2.5 text-center text-[12.5px] font-black uppercase tracking-wider text-amber-300">
              {ok}
            </div>
          )}
          <div className="mt-6">
            <Btn full onClick={submit} disabled={!ready || loading}>
              {loading ? "..." : "активировать"}
            </Btn>
          </div>
          <div className="mt-4 text-center text-[11.5px] text-neutral-500">
            <button onClick={() => navigate("/dash")} className="hover:text-neutral-300">пропустить</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
