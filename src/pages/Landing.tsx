// TypeScript / React / Tailwind. Лендинг PENTA SPOOF #1 — грузинская тема.
import { Logo, Btn, Badge, ClanTag, Ornament } from "../components/ui";
import { navigate } from "../lib/router";

const MODULES = [
  ["HWID", "полная смена идентификатора машины"],
  ["MAC", "новый адрес на каждом адаптере"],
  ["DISPLAY", "чистый идентификатор монитора"],
  ["DISK", "свежий серийник тома"],
  ["GPU", "подмена видеоадаптера"],
  ["SMBIOS", "пересборка прошивочных таблиц"],
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <header className="relative mx-auto max-w-6xl px-6 pt-6">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2.5">
            <Btn variant="soft" onClick={() => navigate("/login")}>вход</Btn>
            <Btn onClick={() => navigate("/register")}>доступ</Btn>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => navigate("/gate")}
            className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500/80 transition hover:text-amber-300"
          >
            активировать ключ →
          </button>
        </div>
        <div className="mt-5 flex justify-center">
          <ClanTag size="sm" />
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-16">
        <div className="pt-10 text-center">
          <Badge tone="ok">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> online
          </Badge>

          <h1 className="mt-7 text-[52px] font-black leading-[0.95] tracking-tighter text-neutral-50 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] sm:text-[86px]">
            PENTA SPOOF
            <span className="block bg-gradient-to-r from-amber-200 via-red-400 to-amber-300 bg-clip-text text-transparent">
              #1
            </span>
          </h1>

          <Ornament className="mt-7" />

          <p className="mx-auto mt-5 max-w-md text-[14px] leading-relaxed text-amber-100/60">
            Спуфер нового поколения. Одна кнопка — чистая машина.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Btn onClick={() => navigate("/register")}>получить доступ</Btn>
            <Btn variant="soft" onClick={() => navigate("/login")}>у меня аккаунт</Btn>
          </div>

          <button
            onClick={() => navigate("/gate")}
            className="mt-5 text-[12px] font-black uppercase tracking-[0.22em] text-amber-500/80 underline decoration-amber-600/40 decoration-2 underline-offset-4 transition hover:text-amber-300 hover:decoration-amber-400"
          >
            уже купил? активировать ключ
          </button>
        </div>

        <Ornament className="mt-16" />

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map(([t, d]) => (
            <div
              key={t}
              className="group relative overflow-hidden rounded-xl border border-amber-950/70 bg-black/50 p-5 backdrop-blur-sm transition hover:border-amber-600/60 hover:bg-black/75"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-red-700/15 blur-2xl transition group-hover:bg-amber-600/25" />
              <div className="relative text-[11px] font-black uppercase tracking-[0.24em] text-amber-400">{t}</div>
              <div className="relative mt-2 text-[12.5px] leading-relaxed text-amber-100/50">{d}</div>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-3">
          {[
            ["01", "регистрация", "аккаунт за 20 секунд"],
            ["02", "ключ", "вводишь 24 символа — доступ открыт"],
            ["03", "загрузка", "качаешь билд, запускаешь, играешь"],
          ].map(([n, t, d]) => (
            <div key={n} className="flex gap-4 rounded-xl border border-amber-950/70 bg-black/40 p-5 backdrop-blur-sm">
              <div className="bg-gradient-to-b from-amber-300 to-red-700 bg-clip-text text-[26px] font-black leading-none text-transparent">
                {n}
              </div>
              <div>
                <div className="text-[13px] font-black text-amber-50">{t}</div>
                <div className="mt-1 text-[12px] text-amber-100/40">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative border-t border-amber-950/60 py-7">
        <div className="flex justify-center">
          <ClanTag size="sm" />
        </div>
        <Ornament className="mt-4" />
        <div className="mt-3 text-center text-[10.5px] font-black uppercase tracking-[0.3em] text-amber-800">
          penta spoof #1
        </div>
      </footer>
    </div>
  );
}
