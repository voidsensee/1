// TypeScript / React / Tailwind. Вход и регистрация (юзер + пароль + автосчитывание HWID).
import { useState } from "react";
import { Logo, Btn, Field, Card, Badge } from "../components/ui";
import { useSession } from "../lib/session";
import { navigate } from "../lib/router";

export default function Auth({ mode }: { mode: "login" | "register" }) {
  const { signIn, signUp, loading, hwid, profile } = useSession();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (profile) {
    navigate(profile.role === "admin" ? "/admin" : profile.expires_at ? "/dash" : "/gate");
  }

  const submit = async () => {
    setErr(null);
    if (mode === "register" && p !== p2) {
      setErr("пароли не совпадают");
      return;
    }
    const e = mode === "login" ? await signIn(u, p) : await signUp(u, p);
    if (e) setErr(e);
    else navigate(mode === "register" ? "/gate" : "/dash");
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(139,92,246,0.2),transparent_60%)]" />
      <Card className="relative w-full max-w-[420px]">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <Badge tone="idle">{mode === "login" ? "вход" : "регистрация"}</Badge>
        </div>

        <div className="space-y-3.5">
          <Field label="юзер" value={u} onChange={setU} placeholder="pentauser" maxLength={20} />
          <Field label="пароль" value={p} onChange={setP} type="password" placeholder="••••••••" />
          {mode === "register" && (
            <Field label="пароль ещё раз" value={p2} onChange={setP2} type="password" placeholder="••••••••" />
          )}
        </div>

        <div className="mt-4 rounded-lg border border-neutral-800/80 bg-black/30 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">HWID устройства</div>
          <div className="mt-1 font-mono text-[12px] text-cyan-300">{hwid || "…"}</div>
        </div>

        {err && (
          <div className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3.5 py-2.5 text-[12.5px] text-red-300">
            {err}
          </div>
        )}

        <div className="mt-5">
          <Btn full onClick={submit} disabled={loading || !u || !p}>
            {loading ? "…" : mode === "login" ? "войти" : "создать аккаунт"}
          </Btn>
        </div>

        <div className="mt-4 text-center text-[12.5px] text-neutral-500">
          {mode === "login" ? (
            <button onClick={() => navigate("/register")} className="hover:text-violet-300">
              нет аккаунта — регистрация
            </button>
          ) : (
            <button onClick={() => navigate("/login")} className="hover:text-violet-300">
              уже есть аккаунт — вход
            </button>
          )}
        </div>
        <div className="mt-3 text-center text-[11.5px] text-neutral-600">
          <button onClick={() => navigate("/")} className="hover:text-neutral-400">
            ← на главную
          </button>
        </div>
      </Card>
    </div>
  );
}
