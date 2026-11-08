// TypeScript / React / Tailwind. Админ-панель: ключи (batch-генерация), юзеры, баны, HWID-сброс, статистика.
import { useCallback, useEffect, useState } from "react";
import { Logo, Btn, Card, Badge, Stat, Field } from "../components/ui";
import { useSession } from "../lib/session";
import { navigate } from "../lib/router";
import { sb, fmtKey } from "../lib/supabase";
import type { KeyRow, Profile } from "../lib/supabase";

type DL = { id: number; user_id: string; version: string | null; hwid: string | null; created_at: string };

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // без O/0/I/1

function randKey(n = 24) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => CHARS[b % CHARS.length]).join("");
}

type Tab = "keys" | "users" | "logs" | "config";

export default function Admin() {
  const { profile, signOut } = useSession();
  const [tab, setTab] = useState<Tab>("keys");
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [dls, setDls] = useState<DL[]>([]);
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  // генератор
  const [count, setCount] = useState("10");
  const [days, setDays] = useState("30");
  const [plan, setPlan] = useState("monthly");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const [k, u, d, c] = await Promise.all([
      sb.from("keys").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("profiles").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("downloads").select("*").order("created_at", { ascending: false }).limit(100),
      sb.from("app_config").select("*"),
    ]);
    setKeys((k.data as KeyRow[]) ?? []);
    setUsers((u.data as Profile[]) ?? []);
    setDls((d.data as DL[]) ?? []);
    const m: Record<string, string> = {};
    for (const r of (c.data as Array<{ key: string; value: string }>) ?? []) m[r.key] = r.value;
    setCfg(m);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (profile?.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <Card>
          <div className="text-[14px] text-neutral-300">доступ только для роли admin</div>
          <div className="mt-3">
            <Btn variant="soft" onClick={() => navigate("/dash")}>
              в кабинет
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  const gen = async () => {
    const n = Math.max(1, Math.min(200, parseInt(count) || 1));
    const d = Math.max(1, Math.min(3650, parseInt(days) || 30));
    const rows = Array.from({ length: n }, () => ({
      key: randKey(24),
      plan,
      duration_days: plan === "lifetime" ? 3650 : d,
      note: note || null,
    }));
    const { error } = await sb.from("keys").insert(rows);
    setMsg(error ? `ошибка: ${error.message}` : `создано ${n} ключей · ${plan} · ${d} дн.`);
    await load();
  };

  const revoke = async (id: string, cur: boolean) => {
    await sb.from("keys").update({ revoked: !cur }).eq("id", id);
    await load();
  };

  const del = async (id: string) => {
    await sb.from("keys").delete().eq("id", id);
    await load();
  };

  const setRole = async (id: string, role: string) => {
    await sb.from("profiles").update({ role: role === "admin" ? "admin" : "user" }).eq("id", id);
    await load();
  };

  const setBan = async (id: string, banned: boolean) => {
    await sb
      .from("profiles")
      .update({ banned, ban_reason: banned ? "заблокирован админом" : null })
      .eq("id", id);
    await load();
  };

  const resetHwid = async (id: string) => {
    await sb.from("profiles").update({ hwid: null, hwid_bound_at: null }).eq("id", id);
    setMsg("HWID сброшен — юзер перепривяжет на следующем входе");
    await load();
  };

  const saveCfg = async (k: string, v: string) => {
    await sb.from("app_config").upsert({ key: k, value: v, updated_at: new Date().toISOString() });
    setMsg(`${k} сохранён`);
    await load();
  };

  const flt = (s: string) => s.toLowerCase().includes(search.toLowerCase());
  const keysView = keys.filter((k) => flt(k.key) || flt(k.plan));
  const usersView = users.filter((u) => flt(u.username) || flt(u.hwid ?? ""));
  const usedCount = keys.filter((k) => k.used_by).length;

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_0%,rgba(139,92,246,0.14),transparent_55%)]" />

      <header className="relative border-b border-neutral-900/80 bg-neutral-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Logo />
            <Badge tone="ok">admin</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Btn variant="soft" onClick={() => navigate("/dash")}>
              кабинет
            </Btn>
            <Btn variant="ghost" onClick={() => void signOut()}>
              выйти
            </Btn>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50">админ-панель</h1>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Stat k="ключей всего" v={String(keys.length)} />
          <Stat k="активировано" v={String(usedCount)} sub={`${keys.length - usedCount} свободно`} />
          <Stat k="юзеров" v={String(users.length)} sub={`${users.filter((u) => u.banned).length} в бане`} />
          <Stat k="загрузок" v={String(dls.length)} sub="всего скачиваний" />
        </div>

        {msg && (
          <div className="mt-4 rounded-lg border border-violet-900/60 bg-violet-950/30 px-3.5 py-2.5 text-[12.5px] text-violet-200">
            {msg}
          </div>
        )}

        <nav className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ["keys", "ключи"],
              ["users", "юзеры"],
              ["logs", "логи загрузок"],
              ["config", "конфиг билда"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-lg border px-3.5 py-2 text-[12.5px] font-medium transition ${
                tab === k
                  ? "border-violet-500/60 bg-violet-500/10 text-violet-200"
                  : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {l}
            </button>
          ))}
        </nav>

        {tab === "keys" && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[340px_1fr]">
            <Card className="h-fit">
              <div className="text-[11px] uppercase tracking-[0.2em] text-violet-400">генератор</div>
              <div className="mt-4 space-y-3.5">
                <Field label="сколько ключей" value={count} onChange={setCount} />
                <Field label="срок, дней" value={days} onChange={setDays} />
                <label className="block">
                  <span className="mb-1.5 block text-[10.5px] uppercase tracking-[0.16em] text-neutral-500">план</span>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900/70 px-3.5 py-2.5 text-[13.5px] text-neutral-100 outline-none focus:border-violet-500/70"
                  >
                    <option value="trial">trial</option>
                    <option value="monthly">monthly</option>
                    <option value="lifetime">lifetime</option>
                  </select>
                </label>
                <Field label="заметка" value={note} onChange={setNote} placeholder="для кого / партия" />
                <Btn full onClick={gen}>
                  сгенерировать {count} ключей
                </Btn>
                <div className="text-[11.5px] leading-relaxed text-neutral-600">
                  24 символа A-Z0-9 без похожих (O/0/I/1). Формат отображения: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX.
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                  ключи · {keysView.length}
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="поиск по ключу…"
                  className="w-52 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-2 text-[12.5px] text-neutral-100 outline-none focus:border-violet-500/70"
                />
              </div>
              <div className="mt-3 max-h-[560px] overflow-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="sticky top-0 bg-neutral-900/95 text-[10.5px] uppercase tracking-wider text-neutral-500">
                    <tr>
                      <th className="px-3 py-2.5">ключ</th>
                      <th className="px-3 py-2.5">план</th>
                      <th className="px-3 py-2.5">срок</th>
                      <th className="px-3 py-2.5">статус</th>
                      <th className="px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {keysView.map((k) => (
                      <tr key={k.id} className="border-t border-neutral-900/80">
                        <td className="px-3 py-2.5 font-mono text-cyan-300">{fmtKey(k.key)}</td>
                        <td className="px-3 py-2.5 text-neutral-400">{k.plan}</td>
                        <td className="px-3 py-2.5 text-neutral-500">{k.duration_days}д</td>
                        <td className="px-3 py-2.5">
                          {k.revoked ? (
                            <Badge tone="bad">отозван</Badge>
                          ) : k.used_by ? (
                            <Badge tone="ok">активен</Badge>
                          ) : (
                            <Badge tone="idle">свободен</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => void navigator.clipboard.writeText(fmtKey(k.key))}
                              className="rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-400 hover:text-cyan-300"
                            >
                              копи
                            </button>
                            <button
                              onClick={() => void revoke(k.id, k.revoked)}
                              className="rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-400 hover:text-amber-300"
                            >
                              {k.revoked ? "вернуть" : "отозвать"}
                            </button>
                            <button
                              onClick={() => void del(k.id)}
                              className="rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-400 hover:text-red-400"
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab === "users" && (
          <Card className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">юзеры · {usersView.length}</div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="поиск по нику / HWID…"
                className="w-56 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-2 text-[12.5px] text-neutral-100 outline-none focus:border-violet-500/70"
              />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="text-[10.5px] uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-3 py-2.5">юзер</th>
                    <th className="px-3 py-2.5">план</th>
                    <th className="px-3 py-2.5">до</th>
                    <th className="px-3 py-2.5">HWID</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {usersView.map((u) => (
                    <tr key={u.id} className="border-t border-neutral-900/80">
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-neutral-100">{u.username}</div>
                        <div className="text-[11px] text-neutral-600">
                          {u.role === "admin" ? "админ · " : ""}
                          {new Date(u.created_at).toLocaleDateString("ru-RU")}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-neutral-400">{u.plan}</td>
                      <td className="px-3 py-2.5 text-neutral-500">
                        {u.expires_at ? new Date(u.expires_at).toLocaleDateString("ru-RU") : "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 font-mono text-[11px] text-cyan-300">
                        {u.hwid ?? "не привязан"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            onClick={() => void resetHwid(u.id)}
                            className="rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-400 hover:text-cyan-300"
                          >
                            сброс HWID
                          </button>
                          <button
                            onClick={() => void setRole(u.id, u.role === "admin" ? "user" : "admin")}
                            className="rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-400 hover:text-violet-300"
                          >
                            {u.role === "admin" ? "снять админа" : "сделать админом"}
                          </button>
                          <button
                            onClick={() => void setBan(u.id, !u.banned)}
                            className={`rounded border px-2 py-1 text-[11px] ${
                              u.banned
                                ? "border-emerald-900/60 text-emerald-400 hover:text-emerald-300"
                                : "border-neutral-800 text-neutral-400 hover:text-red-400"
                            }`}
                          >
                            {u.banned ? "разбан" : "бан"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "logs" && (
          <Card className="mt-5">
            <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">логи загрузок · {dls.length}</div>
            <table className="mt-3 w-full text-left text-[12px]">
              <thead className="text-[10.5px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-3 py-2.5">дата</th>
                  <th className="px-3 py-2.5">версия</th>
                  <th className="px-3 py-2.5">HWID</th>
                  <th className="px-3 py-2.5">user id</th>
                </tr>
              </thead>
              <tbody>
                {dls.map((d) => (
                  <tr key={d.id} className="border-t border-neutral-900/80">
                    <td className="px-3 py-2.5 text-neutral-400">{new Date(d.created_at).toLocaleString("ru-RU")}</td>
                    <td className="px-3 py-2.5 text-neutral-200">{d.version ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-cyan-300">{d.hwid ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-neutral-600">{d.user_id.slice(0, 8)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "config" && (
          <Card className="mt-5 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.2em] text-violet-400">конфиг билда</div>
            <div className="mt-4 space-y-4">
              <div>
                <Field
                  label="download_url — прямая ссылка на архив сборки"
                  value={cfg.download_url ?? ""}
                  onChange={(v) => setCfg({ ...cfg, download_url: v })}
                  placeholder="https://…/penta-spoof-1.0.0.zip"
                  hint="Supabase Storage → bucket builds → upload → Copy public URL"
                />
                <div className="mt-2">
                  <Btn variant="soft" onClick={() => void saveCfg("download_url", cfg.download_url ?? "")}>
                    сохранить ссылку
                  </Btn>
                </div>
              </div>
              <div>
                <Field
                  label="latest_version"
                  value={cfg.latest_version ?? ""}
                  onChange={(v) => setCfg({ ...cfg, latest_version: v })}
                />
                <div className="mt-2">
                  <Btn variant="soft" onClick={() => void saveCfg("latest_version", cfg.latest_version ?? "")}>
                    сохранить версию
                  </Btn>
                </div>
              </div>
              <div>
                <Field
                  label="changelog"
                  value={cfg.changelog ?? ""}
                  onChange={(v) => setCfg({ ...cfg, changelog: v })}
                  hint="виден юзерам в кабинете"
                />
                <div className="mt-2">
                  <Btn variant="soft" onClick={() => void saveCfg("changelog", cfg.changelog ?? "")}>
                    сохранить changelog
                  </Btn>
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
