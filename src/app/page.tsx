import { redirect } from "next/navigation";
import { MODULES } from "@/modules";

// The home page is the first module in the modules config.
export default function Home() {
  redirect(MODULES[0]?.href ?? "/settings");
}
