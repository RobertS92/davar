import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BookOpen, Home, Library, Moon, Radio, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStandalone } from "@/hooks/useStandalone";
import { useEffect } from "react";

const tabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/stations", label: "Stations", icon: Radio },
  { to: "/library", label: "Library", icon: Library },
  { to: "/modes", label: "Modes", icon: Moon },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell() {
  const location = useLocation();
  const standalone = useStandalone();

  const hideChrome =
    location.pathname.startsWith("/listen/") ||
    location.pathname.startsWith("/read/");

  // Scroll main content to top on route change (native-app feel)
  useEffect(() => {
    const el = document.getElementById("app-main-scroll");
    if (el) el.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div
      className={cn(
        "app-frame mx-auto flex w-full",
        standalone ? "max-w-none" : "max-w-desk lg:min-h-dvh lg:py-6 lg:px-6"
      )}
    >
      {/* Desktop sidebar */}
      {!hideChrome && (
        <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-white/5 bg-ink-950/90 p-5 lg:flex lg:rounded-l-3xl lg:border lg:border-white/5 lg:bg-ink-900/80">
          <div className="mb-8 flex items-center gap-3 px-2">
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
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition active:scale-[0.98]",
                    isActive
                      ? "bg-accent/15 text-white shadow-sm shadow-accent/10"
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <tab.icon
                      className={cn("h-5 w-5", isActive ? "text-accent-soft" : "")}
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    {tab.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-xs leading-relaxed text-neutral-500">
            On your phone, open this site in Safari and Add to Home Screen for a full-screen app.
          </div>
        </aside>
      )}

      {/* Main column — phone-width on mobile, flexible on desktop */}
      <div
        className={cn(
          "relative flex min-h-dvh min-w-0 flex-1 flex-col bg-ink-950",
          !hideChrome && "lg:min-h-[calc(100dvh-3rem)] lg:rounded-r-3xl lg:border lg:border-l-0 lg:border-white/5",
          hideChrome && "lg:rounded-3xl lg:border lg:border-white/5"
        )}
      >
        <div
          id="app-main-scroll"
          className={cn(
            "mx-auto flex w-full min-h-0 flex-1 flex-col",
            hideChrome ? "max-w-none" : "max-w-phone lg:max-w-3xl"
          )}
        >
          <div key={location.pathname} className="page-enter flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </div>

        {/* Mobile bottom tab bar */}
        {!hideChrome && (
          <nav
            className={cn(
              "tab-bar glass fixed inset-x-0 bottom-0 z-40 border-t border-white/10 lg:hidden",
              standalone && "tab-bar-standalone"
            )}
            aria-label="Main"
          >
            <div className="mx-auto grid max-w-phone grid-cols-5 px-1 pt-1.5">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      "touch-target relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition active:scale-95",
                      isActive ? "text-accent-soft" : "text-neutral-500"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute -top-0.5 h-1 w-4 rounded-full bg-accent-soft" />
                      )}
                      <tab.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
                      <span>{tab.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            <div className="home-indicator" aria-hidden />
          </nav>
        )}
      </div>
    </div>
  );
}
