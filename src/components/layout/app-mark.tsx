import { cn } from "@/lib/utils";
import { APP_NAME } from "@/modules";

// The app-name slot at the top of the sidebar: a brand-colored tile with the first letter
// of APP_NAME (src/modules/index.ts), then the name. To use your logo instead, swap the
// tile for an <img src="/your-logo.png" className="size-8 rounded-lg" alt="" />.
export function AppMark({ showName = true, className }: { showName?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
      >
        {APP_NAME.trim().charAt(0).toUpperCase()}
      </span>
      <span
        className={cn(
          "whitespace-nowrap text-lg font-medium text-foreground transition-opacity duration-300",
          showName ? "opacity-100" : "opacity-0",
        )}
      >
        {APP_NAME}
      </span>
    </span>
  );
}
