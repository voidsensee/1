// TypeScript / React. Сессия: профиль, HWID, активация ключа, админ-флаг.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { sb, readHwid } from "./supabase";
import type { Profile } from "./supabase";

type Ctx = {
  ready: boolean;
  profile: Profile | null;
  hwid: string;
  loading: boolean;
  refresh: () => Promise<void>;
  signUp: (u: string, p: string) => Promise<string | null>;
  signIn: (u: string, p: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  activate: (key: string) => Promise<string | null>;
  logDownload: (version: string) => Promise<void>;
};

const C = createContext<Ctx>(null as unknown as Ctx);
export const useSession = () => useContext(C);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hwid, setHwid] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await sb.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data: p } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile((p as Profile) ?? null);
    await sb.auth.updateUser({ data: { last_seen: new Date().toISOString() } });
    await sb.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", uid);
  }, []);

  useEffect(() => {
    readHwid().then(setHwid);
    refresh().finally(() => setReady(true));
    const sub = sb.auth.onAuthStateChange(() => void refresh());
    return () => sub.data.subscription.unsubscribe();
  }, [refresh]);

  // login по username: Supabase принимает email -> синтезируем <username>@penta.local
  const emailOf = (u: string) => `${u.trim().toLowerCase()}@penta.local`;

  const signUp = useCallback(
    async (u: string, p: string) => {
      setLoading(true);
      try {
        const name = u.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,20}$/.test(name)) return "ник: 3-20 символов, a-z 0-9 _";
        if (p.length < 6) return "пароль от 6 символов";
        const { error } = await sb.auth.signUp({
          email: emailOf(name),
          password: p,
          options: { data: { username: name } },
        });
        if (error) return error.message;
        await refresh();
        return null;
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const signIn = useCallback(
    async (u: string, p: string) => {
      setLoading(true);
      try {
        const { error } = await sb.auth.signInWithPassword({ email: emailOf(u), password: p });
        if (error) return "неверный юзер или пароль";
        await refresh();
        return null;
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await sb.auth.signOut();
    setProfile(null);
  }, []);

  const activate = useCallback(
    async (key: string) => {
      const clean = key.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      const { data, error } = await sb.rpc("activate_key", { p_key: clean, p_hwid: hwid });
      if (error) return error.message.replace(/^"/, "").replace(/"$/, "");
      await refresh();
      void data;
      return null;
    },
    [hwid, refresh],
  );

  const logDownload = useCallback(
    async (version: string) => {
      if (!profile) return;
      await sb.from("downloads").insert({
        user_id: profile.id,
        version,
        hwid,
        user_agent: navigator.userAgent.slice(0, 250),
      });
    },
    [hwid, profile],
  );

  const value = useMemo(
    () => ({ ready, profile, hwid, loading, refresh, signUp, signIn, signOut, activate, logDownload }),
    [ready, profile, hwid, loading, refresh, signUp, signIn, signOut, activate, logDownload],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}
