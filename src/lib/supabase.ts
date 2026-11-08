// TypeScript / Vite. Клиент Supabase. Ключи зашиты — сайт работает без настроек хостинга.
import { createClient } from "@supabase/supabase-js";

const URL = "https://ahmnjchljnlrnfcjkuaq.supabase.co";
const KEY = "sb_publishable_DJi0UMyLY23tB1kREeiLGw_6C3rwEgp";

const url = import.meta.env.VITE_SUPABASE_URL || URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || KEY;

export const sb = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

export type Profile = {
  id: string;
  username: string;
  hwid: string | null;
  hwid_bound_at: string | null;
  hwid_resets: number;
  role: "user" | "admin";
  banned: boolean;
  ban_reason: string | null;
  plan: "trial" | "monthly" | "lifetime";
  expires_at: string | null;
  created_at: string;
  last_login: string | null;
};

export type KeyRow = {
  id: string;
  key: string;
  plan: string;
  duration_days: number;
  max_hwid_binds: number;
  used_by: string | null;
  used_at: string | null;
  bound_hwid: string | null;
  revoked: boolean;
  note: string | null;
  created_at: string;
};

/** 24 символа A-Z0-9 -> XXXX-XXXX-XXXX-XXXX-XXXX-XXXX */
export function fmtKey(k: string): string {
  const clean = k.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return (clean.match(/.{1,4}/g) ?? []).join("-");
}

/** Валидация ввода ключа: 24 символа, латиница + цифры. */
export function validKey(k: string): boolean {
  return /^[A-Za-z0-9]{24}$/.test(k.replace(/[^A-Za-z0-9]/g, ""));
}

/** Отпечаток устройства: экран + таймзона + язык + ядра + canvas-hash. */
export async function readHwid(): Promise<string> {
  const parts: string[] = [
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "tz",
    navigator.language,
    String(navigator.hardwareConcurrency ?? 0),
    String((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 0),
  ];
  try {
    const c = document.createElement("canvas");
    c.width = 220;
    c.height = 40;
    const g = c.getContext("2d");
    if (g) {
      g.textBaseline = "top";
      g.font = "14px 'Arial'";
      g.fillStyle = "#7f1d1d";
      g.fillRect(0, 0, 220, 40);
      g.fillStyle = "#fef3c7";
      g.fillText("penta-spoof::hwid::7f3a", 4, 8);
      g.strokeStyle = "rgba(217,119,6,0.6)";
      g.arc(40, 20, 14, 0, Math.PI * 1.6);
      g.stroke();
    }
    const data = c.toDataURL();
    let h = 0x811c9dc5;
    for (let i = 0; i < data.length; ++i) {
      h ^= data.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    parts.push(h.toString(16).padStart(8, "0"));
  } catch {
    parts.push("nocanvas");
  }
  const raw = parts.join("|");
  let h1 = 0x9e3779b9 ^ raw.length;
  let h2 = 0x85ebca6b;
  for (let i = 0; i < raw.length; ++i) {
    h1 = Math.imul(h1 ^ raw.charCodeAt(i), 0x85ebca6b) >>> 0;
    h2 = Math.imul(h2 + raw.charCodeAt(i), 0xc2b2ae35) >>> 0;
  }
  return `PENTA-${h1.toString(16).toUpperCase().padStart(8, "0")}-${h2
    .toString(16)
    .toUpperCase()
    .padStart(8, "0")}`;
}
