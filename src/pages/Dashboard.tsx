// TypeScript / React / Tailwind. Дашборд PENTA SPOOF #1.
import { useEffect, useState } from "react";
import { Logo, Btn, Card, Badge, Stat, ClanTag, Ornament } from "../components/ui";
import { useSession } from "../lib/session";
import { navigate } from "../lib/router";
import { sb } from "../lib/supabase";

type Cfg = Record<string, string>;

export default function Dashboard() {
  const { profile, signOut, logDownload } = useSession();
  const [cfg, setCfg] = useState<Cfg>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.from("app_config").select("key,value").then(({ data }) => {
      const m: Cfg = {};
      for (const r of data ?? []) m[(r as { key: string }).key] = (r as { value: string }).value;
      setCfg(m);
    });
  }, []);

  if (!profile) return null;

  const expired = profile.expires_at ? new Date(profile.expires_at).getTime() < Date.now() : false;
  const active = !profile.banned && !expired && profile.expires_at !== null;
  const daysLeft = profile.expires_at
    ? Math.max(0, Math.ceil((new Date(profile.expires_at).getTime() - Date.now()) / 86400000))
    : 0;

  const download = async () => {
    if (!cfg.download_url) return;
    setBusy(true);
    await logDownload(cfg.latest_version ?? "1.0.0");
    const a = document.createElement("a");
    a.href = cfg.download_url;
    a.download = `penta-spoof-${cfg.latest_version ?? "1.0.0"}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => setBusy(false), 800);
  };

  return (
    <div className="relative min-h-screen">
      <header className="relative border-b border-amber-900 bg-black/50 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            {profile.role === "admin" && (
              <Btn variant="soft" onClick={() => navigate("/admin")}>админ</Btn>
            )}
            <div className="text-right">
              <div className="text-[13px] font-black text-amber-50">{profile.username}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                {active ? `${daysLeft} дн.` : expired ? "истекло" : "нет ключа"}
              </div>
            </div>
            <Btn variant="ghost" onClick={() => void signOut()}>выход</Btn>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="flex justify-center"><ClanTag size="md" /></div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[30px] font-black tracking-tight text-neutral-50">ЛИЧНЫЙ КАБИНЕТ</h1>
          <Badge tone={profile.banned ? "bad" : active ? "ok" : "warn"}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              profile.banned ? "bg-red-400" : active ? "bg-amber-400" : "bg-orange-400"
            }`} />
            {profile.banned ? "заблокирован" : active ? "доступ открыт" : expired ? "истекло" : "нужен ключ"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-700/20 blur-3xl">
              &nbsp;
            </div>
            <div className="relative">
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-400">penta spoof #1</div>
              <div className="mt-3 text-[40px] font-black leading-none tracking-tighter text-neutral-50">
                v{cfg.latest_version ?? "1.0.0"}
                <span className="ml-3 align-middle text-[11px] font-bold uppercase tracking-widest text-amber-700">
                  loader
                </span>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Btn onClick={download} disabled={busy || !cfg.download_url}>
                  {busy ? "загрузка..." : "скачать"}
                </Btn>
                {!active && (
                  <Btn variant="soft" onClick={() => navigate("/gate")}>активировать ключ</Btn>
                )}
              </div>

              {!cfg.download_url && (
                <div className="mt-4 text-[11px] uppercase tracking-widest text-orange-400/70">
                  сборка скоро будет доступна
                </div>
              )}

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Stat k="план" v={profile.plan} />
                <Stat k="осталось" v={profile.expires_at ? `${daysLeft}д` : "—"} />
                <Stat k="статус" v={active ? "ok" : "—"} />
</div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-600">модули</div>
              <div className="mt-4 space-y-2">
                {["HWID", "MAC", "DISPLAY", "DISK", "GPU", "SMBIOS"].map((m) => (
                  <div key={m} className="flex items-center gap-3 rounded-lg bg-black/50 px-3 py-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="text-[12px] font-black uppercase tracking-wider text-amber-50">{m}</span>
                    <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-amber-600">ready</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="text-[10px] spoofer font-black uppercase tracking-[0.24em] text-amber-600">обновления</div>
              <pre className="mt-3 whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-amber-100/50">
                {cfg.changelog ?? "—"}
              </pre>
            </Card>
          </div>
        </div>

        <Ornament className="mt-12" />
      </main>
    </div>
  );
}
