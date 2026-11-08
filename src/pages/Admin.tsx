// TypeScript / React / Tailwind. Админ-панель PENTA SPOOF #1.
import { useCallback, useEffect, useState } from "react";
import { Logo, Btn, Card, Badge, Stat, Field, ClanTag } from "../components/ui";
import { useSession } from "../lib/session";
import { navigate } from "../lib/router";
import { sb, fmtKey } from "../lib/supabase";
import type { KeyRow, Profile } from "../lib/supabase";

type DL = { id: number; user_id: string; version: string | null; created_at: string };
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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

  useEffect(() => { void load(); }, [load]);

  if (profile?.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <Card>
          <div className="text-[14px] text-amber-100">доступ только для админа</div>
          <div className="mt-3">
            <Btn variant="soft" onClick={() => navigate("/dash")}>в кабинет</Btn>
          </div>
        </Card>
      </div>
    );
  }

  const gen = async () => {
    const n = Math.max(1, Math.min(200, parseInt(count) || 1));
    const d = Math.max(1, Math.min(3650, parseInt(days) || 30));
    const rows = Array.from({ length: n }, () => ({
      key: randKey(24), plan,
      duration_days: plan === "lifetime" ? 3650 : d,
      note: note || null,
    }));
    const { error } = await sb.from("keys").insert(rows);
    setMsg(error ? "ошибка: " + error.message : "создано " + n + " ключей");
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
    await sb.from("profiles").update({ banned, ban_reason: banned ? "заблокирован" : null }).eq("id", id);
    await load();
  };
  const resetHwid = async (id: string) => {
    await sb.from("profiles").update({ hwid: null, hwid_bound_at: null }).eq("id", id);
    setMsg("привязка сброшена");
    await load();
  };
  const saveCfg = async (k: string, v: string) => {
    await sb.from("app_config").upsert({ key: k, value: v, updated_at: new Date().toISOString() });
    setMsg(k + " сохранён");
    await load();
  };

  const flt = (s: string) => s.toLowerCase().includes(search.toLowerCase());
  const keysView = keys.filter((k) => flt(k.key) || flt(k.plan));
  const usersView = users.filter((u) => flt(u.username));
  const usedCount = keys.filter((k) => k.used_by).length;

  return (
    <div className="relative min-h-screen">
      <header className="relative border-b border-amber-900 bg-black/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Logo />
            <Badge tone="ok">admin</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Btn variant="soft" onClick={() => navigate("/dash")}>кабинет</Btn>
            <Btn variant="ghost" onClick={() => void signOut()}>выход</Btn>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-8">
        <div className="flex justify-center"><ClanTag size="sm" /></div>
        <h1 className="mt-5 text-[28px] font-black tracking-tight text-neutral-50">АДМИН</h1>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Stat k="ключей" v={String(keys.length)} />
          <Stat k="активировано" v={String(usedCount)} sub={String(keys.length - usedCount) + " свободно"} />
          <Stat k="юзеров" v={String(users.length)} sub={String(users.filter((u) => u.banned).length) + " в бане"} />
          <Stat k="загрузок" v={String(dls.length)} />
        </div>

        {msg && (
          <div className="mt-4 rounded-lg border border-amber-800 bg-amber-950 px-3.5 py-2.5 text-[12.5px] text-amber-200">
            {msg}
          </div>
        )}

        <nav className="mt-6 flex flex-wrap gap-2">
          {([["keys","ключи"],["users","юзеры"],["logs","логи"],["config","конфиг"]] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={"rounded-lg border px-3.5 py-2 text-[12.5px] font-black uppercase tracking-wider transition " + (
                tab === k
                  ? "border-amber-500 bg-amber-500/10 text-amber-200"
                  : "border-amber-900 bg-black/50 text-amber-200/70 hover:text-amber-100"
              )}
            >
              {l}
            </button>
          ))}
        </nav>

        {tab === "keys" && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[340px_1fr]">
            <Card className="h-fit">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">генератор</div>
              <div className="mt-4 space-y-3.5">
                <Field label="сколько ключей" value={count} onChange={setCount} />
                <Field label="срок, дней" value={days} onChange={setDays} />
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-amber-600">план</span>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full rounded-lg border border-amber-900 bg-black/60 px-3.5 py-3 text-[13.5px] text-neutral-100 outline-none focus:border-amber-500"
                  >
                    <option value="trial">trial</option>
                    <option value="monthly">monthly</option>
                    <option value="lifetime">lifetime</option>
                  </select>
                </label>
                <Field label="заметка" value={note} onChange={setNote} placeholder="партия" />
                <Btn full onClick={gen}>сгенерировать {count}</Btn>
                <div className="text-[11.5px] text-neutral-500">
                  24 символа A-Z0-9. Формат: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">ключи · {keysView.length}</div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="поиск по ключу"
                  className="w-52 rounded-lg border border-amber-900 bg-black/60 px-3 py-2 text-[12.5px] text-neutral-100 outline-none focus:border-amber-500"
                />
              </div>
              <div className="mt-3 max-h-[560px] overflow-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="sticky top-0 bg-black/90 text-[10.5px] uppercase tracking-wider text-amber-600">
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
                      <tr key={k.id} className="border-t border-amber-900/50">
                        <td className="px-3 py-2.5 font-mono text-amber-300">{fmtKey(k.key)}</td>
                        <td className="px-3 py-2.5 text-amber-100/60">{k.plan}</td>
                        <td className="px-3 py-2.5 text-neutral-500">{k.duration_days}д</td>
                        <td className="px-3 py-2.5">
                          {k.revoked ? <Badge tone="bad">отозван</Badge>
                            : k.used_by ? <Badge tone="ok">активен</Badge>
                            : <Badge tone="idle">свободен</Badge>}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => void navigator.clipboard.writeText(fmtKey(k.key))}
                              className="rounded border border-amber-900 px-2 py-1 text-[11px] text-amber-200/70 hover:text-amber-300">копи</button>
                            <button onClick={() => void revoke(k.id, k.revoked)}
                              className="rounded border border-amber-900 px-2 py-1 text-[11px] text-amber-200/70 hover:text-orange-300">{k.revoked ? "вернуть" : "отозвать"}</button>
                            <button onClick={() => void del(k.id)}
                              className="rounded border border-amber-900 px-2 py-1 text-[11px] text-amber-200/70 hover:text-red-400">×</button>
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
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">юзеры · {usersView.length}</div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="поиск по нику"
                className="w-56 rounded-lg border border-amber-900 bg-black/60 px-3 py-2 text-[12.5px] text-neutral-100 outline-none focus:border-amber-500"
              />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="text-[10.5px] uppercase tracking-wider text-amber-600">
                  <tr>
                    <th className="px-3 py-2.5">юзер</th>
                    <th className="px-3 py-2.5">план</th>
                    <th className="px-3 py-2.5">до</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {usersView.map((u) => (
                    <tr key={u.id} className="border-t border-amber-900/50">
                      <td className="px-3 py-2.5">
                        <div className="font-black text-amber-50">{u.username}</div>
                        <div className="text-[11px] text-neutral-600">
                          {u.role === "admin" ? "админ · " : ""}
                          {new Date(u.created_at).toLocaleDateString("ru-RU")}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-amber-100/60">{u.plan}</td>
                      <td className="px-3 py-2.5 text-neutral-500">
                        {u.expires_at ? new Date(u.expires_at).toLocaleDateString("ru-RU") : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button onClick={() => void resetHwid(u.id)}
                            className="rounded border border-amber-900 px-2 py-1 text-[11px] text-amber-200/70 hover:text-amber-300">привязка</button>
                          <button onClick={() => void setRole(u.id, u.role === "admin" ? "user" : "admin")}
                            className="rounded border border-amber-900 px-2 py-1 text-[11px] text-amber-200/70 hover:text-amber-300">{u.role === "admin" ? "снять админа" : "сделать админом"}</button>
                          <button onClick={() => void setBan(u.id, !u.banned)}
                            className={"rounded border px-2 py-1 text-[11px] " + (
                              u.banned
                                ? "border-amber-700 text-amber-400"
                                : "border-amber-900 text-amber-200/70 hover:text-red-400"
                            )}>{u.banned ? "разбан" : "бан"}</button>
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
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">логи · {dls.length}</div>
            <table className="mt-3 w-full text-left text-[12px]">
              <thead className="text-[10.5px] uppercase tracking-wider text-amber-600">
                <tr>
                  <th className="px-3 py-2.5">дата</th>
                  <th className="px-3 py-2.5">версия</th>
                  <th className="px-3 py-2.5">user</th>
                </tr>
              </thead>
              <tbody>
                {dls.map((d) => (
                  <tr key={d.id} className="border-t border-amber-900/50">
                    <td className="px-3 py-2.5 text-amber-100/60">{new Date(d.created_at).toLocaleString("ru-RU")}</td>
                    <td className="px-3 py-2.5 text-amber-50">{d.version ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-neutral-600">{d.user_id.slice(0, 8)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "config" && (
          <Card className="mt-5 max-w-2xl">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">конфиг билда</div>
            <div className="mt-4 space-y-4">
              <div>
                <Field label="download_url — ссылка на архив" value={cfg.download_url ?? ""}
                  onChange={(v) => setCfg({ ...cfg, download_url: v })}
                  placeholder="https://.../penta-spoof.zip"
                  hint="Supabase Storage - bucket builds - Copy public URL" />
                <div className="mt-2">
                  <Btn variant="soft" onClick={() => void saveCfg("download_url", cfg.download_url ?? "")}>сохранить ссылку</Btn>
                </div>
              </div>
              <div>
                <Field label="latest_version" value={cfg.latest_version ?? ""}
                  onChange={(v) => setCfg({ ...cfg, latest_version: v })} />
                <div className="mt-2">
                  <Btn variant="soft" onClick={() => void saveCfg("latest_version", cfg.latest_version ?? "")}>сохранить версию</Btn>
                </div>
              </div>
              <div>
                <Field label="changelog" value={cfg.changelog ?? ""}
                  onChange={(v) => setCfg({ ...cfg, changelog: v })} hint="виден юзерам" />
                <div className="mt-2">
                  <Btn variant="soft" onClick={() => void saveCfg("changelog", cfg.changelog ?? "")}>сохранить changelog</Btn>
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
