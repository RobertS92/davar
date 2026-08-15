import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BookOpen,
  Home,
  Library,
  Moon,
  Radio,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";

const tabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/stations", label: "Stations", icon: Radio },
  { to: "/library", label: "Library", icon: Library },
  { to: "/modes", label: "Modes", icon: Moon },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell() {
  const location = useLocation();
  const hideChrome =
    location.pathname.startsWith("/listen/") ||
    location.pathname.startsWith("/read/") ||
    location.pathname === "/onboarding";

  return (
    <div className="app-shell mx-auto flex w-full max-w-desk">
      {!hideChrome && (
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/5 bg-ink-950/80 p-5 lg:flex">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-soft">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold tracking-tight">Davar</p>
              <p className="text-xs text-neutral-400">Scripture playlists</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-accent/15 text-white"
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  )
                }
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <p className="px-2 text-xs text-neutral-500">
            Open this site on your phone and Add to Home Screen for an app-like experience.
          </p>
        </aside>
      )}

      <div className="relative flex min-h-dvh min-w-0 flex-1 flex-col">
        <div
          className={cn(
            "mx-auto flex w-full flex-1 flex-col",
            hideChrome ? "max-w-none" : "max-w-phone lg:max-w-none"
          )}
        >
          <Outlet />
        </div>

        {!hideChrome && (
          <nav className="glass safe-bottom sticky bottom-0 z-30 border-t border-white/5 lg:hidden">
            <div className="mx-auto grid max-w-phone grid-cols-5 px-1 pt-2">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium",
                      isActive ? "text-accent-soft" : "text-neutral-400"
                    )
                  }
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
