import { CalendarCheck, PhoneCall, TrendingUp } from "lucide-react";
import { AppMark } from "@/components/layout/app-mark";
import { APP_NAME } from "@/modules";

// The frame the sign-in and setup screens sit in: a dark brand panel on the left (large
// screens only) and a single narrow column on the right.
function BrandPanel() {
  const points = [
    { icon: CalendarCheck, text: "Every Calendly booking in one place" },
    { icon: PhoneCall, text: "Log every call and see when people pick up" },
    { icon: TrendingUp, text: "Know your close rate at a glance" },
  ];
  return (
    <div className="relative hidden overflow-hidden border-r border-white/[0.07] bg-brand-panel p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
      {/* Two soft glows in the brand color. */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-[130px]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-48 h-[26rem] w-[26rem] rounded-full bg-primary/12 blur-[130px]" />

      <div className="relative animate-in fade-in slide-in-from-top-2 duration-700 [&_span]:text-white">
        <AppMark />
      </div>

      <div className="relative max-w-md">
        <p className="text-[11px] font-medium tracking-[0.28em] text-white/40 uppercase">{APP_NAME}</p>
        <h1 className="mt-5 text-[2.6rem] leading-[1.08] font-semibold tracking-[-0.02em]">
          Your sales calls, <span className="text-primary">organized.</span>
        </h1>
        <ul className="mt-10 space-y-4">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3.5 text-[15px] text-white/70">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
                <Icon className="size-4 text-primary" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/30">Private to your team.</p>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Below lg the brand panel is hidden, so the app name comes across. */}
          <div className="mb-10 lg:hidden">
            <AppMark />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
