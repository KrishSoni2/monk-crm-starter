import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { repColorVar } from "@/modules/sales/types";

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

export function RepDot({ color }: { color: string }) {
  return <span aria-hidden className="inline-block size-2 shrink-0 rounded-full" style={{ background: repColorVar(color) }} />;
}

/** Round initials avatar. With a rep color, the initials take that color. */
export function InitialsAvatar({ name, color, className }: { name: string; color?: string; className?: string }) {
  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarFallback className="text-xs font-medium" style={color ? { color: repColorVar(color) } : undefined}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function RepLabel({ rep }: { rep: { name: string; color: string } | undefined }) {
  if (!rep) return <span className="text-subtle">Unassigned</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <InitialsAvatar name={rep.name} color={rep.color} className="size-5 [&_[data-slot=avatar-fallback]]:text-[10px]" />
      {rep.name}
    </span>
  );
}
