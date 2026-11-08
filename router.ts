// TypeScript. Минимальный хэш-роутер: useRoute() + navigate().
import { useEffect, useState } from "react";

export function useRoute(): string {
  const get = () => (window.location.hash.replace(/^#/, "") || "/").toLowerCase();
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => setRoute(get());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function navigate(to: string) {
  window.location.hash = to;
}
