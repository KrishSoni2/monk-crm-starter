"use client";

import { useMemo, useState } from "react";
import { BookingPanel } from "@/modules/sales/components/booking-panel";
import { BookingsTable } from "@/modules/sales/components/bookings-table";
import { useBookings } from "@/modules/sales/components/use-bookings";
import type { BookingRow, RepRow } from "@/modules/sales/types";

// The interactive part of the Sales page: holds the bookings in memory so every
// change shows instantly, and opens the side panel for the selected booking.
export function SalesWorkspace({ initialBookings, reps }: { initialBookings: BookingRow[]; reps: RepRow[] }) {
  const { bookings, patchBooking, addCall, deleteCall } = useBookings(initialBookings);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const repsById = useMemo(() => new Map(reps.map((r) => [r.id, r])), [reps]);
  const selected = bookings.find((b) => b.id === selectedId) ?? null;

  return (
    <>
      <BookingsTable bookings={bookings} repsById={repsById} selectedId={selectedId} onSelect={setSelectedId} />
      <BookingPanel
        booking={selected}
        reps={reps}
        onClose={() => setSelectedId(null)}
        onPatch={patchBooking}
        onAddCall={addCall}
        onDeleteCall={deleteCall}
      />
    </>
  );
}
