// TypeScript / React / Tailwind. Дашборд: лицензия, HWID, версия, скачивание билда, changelog.
import { useEffect, useState } from "react";
import { Logo, Btn, Card, Badge, Stat } from "../components/ui";
import { useSession } from "../lib/session";
import { navigate } from "../lib/router";
import { sb } from "../lib/supabase";

type Cfg = Record<string, string>;

export default function Dashboard() {
  const { profile, hwid, signOut, logDownload } = useSession();
  const [cfg, setCfg] = useState<Cfg>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.from("app_config")
      .select("key,value")
      .then(({ data }) => {
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
    const url = cfg.download_url;
    if (!url) return;
    setBusy(true);
    await logDownload(cfg.latest_version ?? "1.0.0");
    const a = document.createElement("a");
    a.href = url;
    a.download = `penta-spoof-${cfg.latest_version ?? "1.0.0"}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => setBusy(false), 900);
  };

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_-5%,rgba(139,92,246,0.16),transparent_55%),radial-gradient(ellipse_at_90%_10%,rgba(34,211,238,0.1),transparent_50%)]" />

      <header className="relative border-b border-neutral-900/80 bg-neutral-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            {profile.role === "admin" && (
              <Btn variant="soft" onClick={() => navigate("/admin")}>
                админ-панель
              </Btn>
            )}
            <div className="hidden text-right sm:block">
              <div className="text-[12.5px] font-semibold text-neutral-200">{profile.username}</div>
              <div className="text-[10.5px] text-neutral-500">
                {profile.plan} · {active ? `${daysLeft} дн.` : expired ? "истекла" : "без ключа"}
              </div>
            </div>
            <Btn variant="ghost" onClick={() => void signOut()}>
              выйти
            </Btn>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-50">личный кабинет</h1>
            <p className="mt-1 text-[13px] text-neutral-500">
              сборка {cfg.latest_version ?? "1.0.0"} · обновлено {new Date().toLocaleDateString("ru-RU")}
            </p>
          </div>
          <Badge tone={profile.banned ? "bad" : active ? "ok" : "warn"}>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                profile.banned ? "bg-red-400" : active ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            {profile.banned ? "заблокирован" : active ? "доступ активен" : expired ? "лицензия истекла" : "ключ не активирован"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-violet-600/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-violet-400">penta spoof loader</div>
                  <div className="mt-2 text-[22px] font-bold text-neutral-50">
                    v{cfg.latest_version ?? "1.0.0"}
                  </div>
                </div>
                <Badge tone="idle">spoofer.exe + sphook.dll</Badge>
              </div>

              <p className="mt-3 text-[13px] leading-relaxed text-neutral-400">
                Архив: утилита с бэкапом/restore и инжект-DLL на MinHook. Запуск от администратора,
                <code className="mx-1 rounded bg-neutral-800 px-1.5 py-0.5 text-[12px] text-cyan-300">report</code>
                перед прогоном.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Btn onClick={download} disabled={busy || !cfg.download_url}>
                  {busy ? "загрузка…" : "скачать сборку"}
                </Btn>
                <Btn variant="soft" onClick={() => navigate("/gate")}>
                  активировать ключ
                </Btn>
              </div>
              {!cfg.download_url && (
                <div className="mt-3 text-[11.5px] text-amber-400/90">
                  ссылка на билд не задана — админ указывает её в админ-панели (app_config → download_url)
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">лицензия</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat k="план" v={profile.plan} />
                <Stat k="осталось" v={profile.expires_at ? `${daysLeft} дн.` : "—"} />
              </div>
              <div className="mt-3 space-y-1.5 text-[12.5px]">
                <Row l="аккаунт" v={profile.username} />
                <Row l="создан" v={new Date(profile.created_at).toLocaleDateString("ru-RU")} />
                <Row l="действует до" v={profile.expires_at ? new Date(profile.expires_at).toLocaleString("ru-RU") : "—"} />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">HWID</div>
                <Badge tone="ok">привязан</Badge>
              </div>
              <div className="mt-3 break-all rounded-lg border border-neutral-800/80 bg-black/40 px-3 py-2.5 font-mono text-[12px] text-cyan-300">
                {profile.hwid || hwid}
              </div>
              <div className="mt-2 text-[11.5px] text-neutral-600">
                сброс HWID — только через админа · использовано сбросов: {profile.hwid_resets}
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">что подменяется</div>
            <div className="mt-3 space-y-2">
              {[
                ["HWID", "MachineGuid · ProductId · SQM · CDP · BIOS-строки"],
                ["SMBIOS", "Type 0/1/2/3/4 · UUID · ProcessorID · серийники"],
                ["MAC", "NetworkAddress + NDIS-тоггл, локально-админ OUI"],
                ["DISPLAY ID", "EDID: PNP-id · product · serial · checksum"],
                ["DISK", "volume serial: NTFS 0x48 / FAT32 0x43"],
                ["RENUM", "инстансы DISPLAY/MONITOR/SCSI/IDE/USB"],
              ].map(([t, d]) => (
                <div key={t} className="flex items-start gap-3 rounded-lg bg-neutral-900/40 px-3 py-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                  <div>
                    <span className="text-[12.5px] font-semibold text-neutral-200">{t}</span>
                    <span className="ml-2 text-[12px] text-neutral-500">{d}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">changelog</div>
            <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-neutral-800/80 bg-black/40 px-3.5 py-3 text-[12.5px] leading-relaxed text-neutral-300">
              {cfg.changelog ?? "нет данных"}
            </pre>
            <div className="mt-3 text-[11.5px] text-neutral-600">
              поддержка: тикеты в кабинете админа · бэкап создаётся автоматически как spoofer_backup.txt
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5 last:border-0">
      <span className="text-neutral-500">{l}</span>
      <span className="text-neutral-200">{v}</span>
    </div>
  );
}
