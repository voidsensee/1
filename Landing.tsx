// TypeScript / React / Tailwind. Лендинг penta spoof: слои подмены, версия, вход.
import { Logo, Btn, Badge } from "../components/ui";
import { navigate } from "../lib/router";

const FEATURES = [
  ["HWID", "MachineGuid · ProductId · SMBIOS Type 0/1/2/3/4 · UUID · ProcessorID"],
  ["MAC", "NetworkAddress + NDIS-тоггл адаптера через SetupDi, локально-админ OUI"],
  ["DISPLAY ID", "EDID: PNP-id, product code, serial, дескрипторы, контрольная сумма"],
  ["DISK", "volume serial в boot sector: NTFS 0x48 / FAT32 0x43, dismount + запись"],
  ["RENUM", "инстансы устройств 5&…&0&UID → 9&<новый>&…, меняет DeviceID"],
  ["DLL", "инжект-хуки: GetSystemFirmwareTable, NtQuerySystemInformation, RegQueryValueExW"],
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(ellipse_at_85%_15%,rgba(34,211,238,0.13),transparent_50%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.9) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.9) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Btn variant="soft" onClick={() => navigate("/login")}>
            вход
          </Btn>
          <Btn onClick={() => navigate("/register")}>получить доступ</Btn>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="pt-14 text-center">
          <Badge tone="ok">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> сборка 1.0.0 · тестовый стенд
          </Badge>
          <h1 className="mx-auto mt-6 max-w-3xl text-[42px] font-bold leading-[1.08] tracking-tight text-neutral-50 sm:text-6xl">
            Меняешь машину —
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              {" "}
              не меняешь железо
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-400">
            Спуфер уровня usermode + инжект-DLL: SMBIOS с пересчётом контрольных сумм, MAC, EDID, volume serial,
            ренамбер инстансов. Вход по 24-символьному ключу, привязка к HWID, полная статистика в личном кабинете.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Btn onClick={() => navigate("/register")}>Активировать ключ</Btn>
            <Btn variant="soft" onClick={() => navigate("/login")}>
              У меня аккаунт
            </Btn>
          </div>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([t, d]) => (
            <div
              key={t}
              className="group rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 transition hover:border-violet-600/50 hover:bg-neutral-900/70"
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400">{t}</div>
              <div className="mt-2.5 text-[13px] leading-relaxed text-neutral-400">{d}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-4 lg:grid-cols-3">
          {[
            ["1", "регистрация", "юзер + пароль + автосчитывание HWID в браузере"],
            ["2", "ключ", "24 символа: ABCD-EFGH-…, привязка к HWID на первом входе"],
            ["3", "дашборд", "статус лицензии, версия, кнопка скачать, changelog"],
          ].map(([n, t, d]) => (
            <div key={n} className="flex gap-4 rounded-2xl border border-neutral-800/80 bg-neutral-900/30 p-5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-[13px] font-bold text-white">
                {n}
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-neutral-100">{t}</div>
                <div className="mt-1 text-[12.5px] text-neutral-500">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative border-t border-neutral-900 py-6 text-center text-[11.5px] text-neutral-600">
        penta spoof · тестовый стенд · сборка через cmake, цели spoofer.exe + sphook.dll
      </footer>
    </div>
  );
}
