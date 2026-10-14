import type { BookingStatus } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/modules/sales/types";

// Soft tinted pill per status. The colors live in src/theme/theme.css (--status-*).
export const STATUS_PILL: Record<BookingStatus, string> = {
  BOOKED: "bg-status-booked text-status-booked-foreground",
  SHOWED: "bg-status-showed text-status-showed-foreground",
  NO_SHOW: "bg-status-no-show text-status-no-show-foreground",
  NOT_QUALIFIED: "bg-status-not-qualified text-status-not-qualified-foreground",
  CLOSED: "bg-status-closed text-status-closed-foreground",
  LOST: "bg-status-lost text-status-lost-foreground",
};

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <Badge className={cn("rounded-full border-transparent", STATUS_PILL[status], className)}>{STATUS_LABELS[status]}</Badge>
  );
}

export function CanceledTag() {
  return (
    <Badge className="rounded-full border-transparent bg-status-canceled text-status-canceled-foreground">Canceled</Badge>
  );
}
