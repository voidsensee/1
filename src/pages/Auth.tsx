// TypeScript / React / Tailwind. Вход и регистрация PENTA SPOOF #1.
import { useState } from "react";
import { Logo, Btn, Field, Card, ClanTag } from "../components/ui";
import { useSession } from "../lib/session";
import { navigate } from "../lib/router";

export default function Auth({ mode }: { mode: "login" | "register" }) {
  const { signIn, signUp, loading, profile } = useSession();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (profile) navigate(profile.role === "admin" ? "/admin" : "/dash");

  const submit = async () => {
    setErr(null);
    if (mode === "register" && p !== p2) { setErr("пароли не совпадают"); return; }
    const e = mode === "login" ? await signIn(u, p) : await signUp(u, p);
    if (e) setErr(e);
    else navigate(mode === "register" ? "/gate" : "/dash");
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5">
      <div className="relative w-full max-w-[400px]">
        <div className="mb-5 flex justify-center"><ClanTag size="sm" /></div>
        <Card>
          <div className="flex flex-col items-center gap-4">
            <Logo size={34} />
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-neutral-400">
              {mode === "login" ? "вход в систему" : "новый аккаунт"}
            </div>
          </div>
          <div className="mt-7 space-y-3.5">
            <Field label="ник" value={u} onChange={setU} placeholder="username" maxLength={20} />
            <Field label="пароль" value={p} onChange={setP} type="password" placeholder="12345678" />
            {mode === "register" && (
              <Field label="повтор пароля" value={p2} onChange={setP2} type="password" placeholder="12345678" />
            )}
          </div>
          {err && (
            <div className="mt-4 rounded-lg border border-red-800 bg-red-950 px-3.5 py-2.5 text-center text-[12.5px] text-red-300">
              {err}
            </div>
          )}
          <div className="mt-6">
            <Btn full onClick={submit} disabled={loading || !u || !p}>
              {loading ? "..." : mode === "login" ? "войти" : "создать"}
            </Btn>
          </div>
          <div className="mt-5 text-center text-[12px] text-neutral-500">
            {mode === "login" ? (
              <button onClick={() => navigate("/register")} className="hover:text-amber-300">нет аккаунта — регистрация</button>
            ) : (
              <button onClick={() => navigate("/login")} className="hover:text-amber-300">уже есть аккаунт — вход</button>
            )}
          </div>
        </Card>
        <div className="mt-4 text-center text-[11px] text-neutral-600">
          <button onClick={() => navigate("/")} className="hover:text-neutral-400">назад</button>
        </div>
      </div>
    </div>
  );
}
