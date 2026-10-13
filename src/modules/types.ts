import type { LucideIcon } from "lucide-react";

export type ModuleDefinition = {
  /** Folder name under src/modules and the URL segment, e.g. "sales". */
  id: string;
  /** Text shown in the sidebar. */
  label: string;
  /** Page the sidebar links to. Must match src/app/(app)/<id>/page.tsx. */
  href: string;
  /** Any icon from lucide-react (browse them at lucide.dev/icons). */
  icon: LucideIcon;
  /** One line describing the module (for docs and AI assistants). */
  description: string;
};
