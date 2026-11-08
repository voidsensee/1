// TypeScript / React / Tailwind. penta spoof: лендинг, auth, gate по 24-симв ключу, дашборд, админка.
import { SessionProvider, useSession } from "./lib/session";
import { useRoute, navigate } from "./lib/router";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Gate from "./pages/Gate";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import { Logo } from "./components/ui";

function Shell() {
  const { ready, profile } = useSession();
  const route = useRoute();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-[13px] text-neutral-500">загрузка…</div>
      </div>
    );
  }

  // гость на закрытых страницах -> на вход
  const guarded = ["/dash", "/admin", "/gate"];
  if (guarded.includes(route) && !profile) {
    navigate("/login");
    return null;
  }

  switch (route) {
    case "/login":
      return <Auth mode="login" />;
    case "/register":
      return <Auth mode="register" />;
    case "/gate":
      return <Gate />;
    case "/dash":
      return <Dashboard />;
    case "/admin":
      return <Admin />;
    default:
      return <Landing />;
  }
}

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono antialiased selection:bg-violet-500/30">
      <SessionProvider>
        <Shell />
      </SessionProvider>
      <div className="pointer-events-none fixed bottom-3 right-4 opacity-40">
        <Logo size={18} />
      </div>
    </div>
  );
}
