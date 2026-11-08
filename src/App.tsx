// TypeScript / React / Tailwind. PENTA SPOOF #1 — грузинская тема.
import { SessionProvider, useSession } from "./lib/session";
import { useRoute, navigate } from "./lib/router";
import Backdrop from "./components/Backdrop";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Gate from "./pages/Gate";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

function Shell() {
  const { ready, profile } = useSession();
  const route = useRoute();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-[13px] uppercase tracking-[0.3em] text-amber-600">загрузка…</div>
      </div>
    );
  }

  const guarded = ["/dash", "/admin", "/gate"];
  if (guarded.includes(route) && !profile) {
    navigate("/login");
    return null;
  }

  switch (route) {
    case "/login": return <Auth mode="login" />;
    case "/register": return <Auth mode="register" />;
    case "/gate": return <Gate />;
    case "/dash": return <Dashboard />;
    case "/admin": return <Admin />;
    default: return <Landing />;
  }
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0305] text-neutral-200 font-mono antialiased selection:bg-amber-500/30">
      <Backdrop />
      <SessionProvider>
        <Shell />
      </SessionProvider>
    </div>
  );
}
