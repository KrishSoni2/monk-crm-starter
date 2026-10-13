import { CalendarDays } from "lucide-react";
import type { ModuleDefinition } from "@/modules/types";

// Registers the Sales module in the sidebar. See src/modules/index.ts.
export const salesModule: ModuleDefinition = {
  id: "sales",
  label: "Sales",
  href: "/sales",
  icon: CalendarDays,
  description: "Calendly bookings, call attempts and outcomes",
};
