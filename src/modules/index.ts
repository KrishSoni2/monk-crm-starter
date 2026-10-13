import { salesModule } from "@/modules/sales/module";
import type { ModuleDefinition } from "@/modules/types";

// AI-GUIDE: The modules config. The sidebar is built from this array, in this order.
// To add a module:
//   1. Create src/modules/<id>/ by copying the structure of src/modules/sales/.
//   2. Create its page at src/app/(app)/<id>/page.tsx.
//   3. Import its module.ts here and add it to MODULES.
// The first module is the home page (/ redirects to it).
// Full walkthrough: docs/ADDING-A-MODULE.md

// The name shown at the top of the sidebar and on the sign-in page. Rename freely.
export const APP_NAME = "CRM Starter";

export const MODULES: ModuleDefinition[] = [salesModule];
