// Database reads for the Sales module.
import { getDb } from "@/lib/db";
import { isDemoMode } from "@/lib/env";
import { ensureDemoData } from "@/modules/sales/demo/seed";

// Called by Sales pages before reading. In demo mode it fills an empty database with
// fictional sample data; with a Calendly token set it does nothing.
export async function prepareSalesData() {
  if (isDemoMode()) await ensureDemoData(getDb());
}

export async function getSalesOverview() {
  await prepareSalesData();
  const db = getDb();
  const [bookings, reps, callAttempts] = await Promise.all([
    db.booking.count(),
    db.rep.count(),
    db.callAttempt.count(),
  ]);
  return { bookings, reps, callAttempts };
}
