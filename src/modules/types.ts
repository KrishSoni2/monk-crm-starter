import type { IconName } from "@/components/icons";

export type ModuleDefinition = {
  /** Folder name under src/modules and the URL segment, e.g. "sales". */
  id: string;
  /** Text shown in the sidebar. */
  label: string;
  /** Page the sidebar links to. Must match src/app/(app)/<id>/page.tsx. */
  href: string;
  /** An icon name from src/components/icons.tsx. */
  icon: IconName;
  /** One line describing the module (for docs and AI assistants). */
  description: string;
};
