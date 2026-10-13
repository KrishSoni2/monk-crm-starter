"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { addCallAttempt, deleteCallAttempt, updateBooking } from "@/modules/sales/server/actions";
import type { NewCallAttempt } from "@/modules/sales/components/call-attempts";
import type { BookingPatch, BookingRow } from "@/modules/sales/types";

// Optimistic updates: every change shows on screen immediately, then saves in the
// background. If the save fails, only the fields that change touched are put back
// (so a failure never wipes out a different edit you made meanwhile) and a short
// message explains what happened.
export function useBookings(initial: BookingRow[]) {
  const [bookings, setBookings] = useState(initial);
  // Always-current copy, so we can note the old values before changing them.
  const current = useRef(bookings);
  useEffect(() => {
    current.current = bookings;
  }, [bookings]);
  const find = (id: string) => current.current.find((b) => b.id === id);

  const replace = useCallback((id: string, update: (b: BookingRow) => BookingRow) => {
    setBookings((list) => list.map((b) => (b.id === id ? update(b) : b)));
  }, []);

  const patchBooking = useCallback(
    (id: string, patch: BookingPatch) => {
      const before = find(id);
      if (!before) return;
      const previous = Object.fromEntries(Object.keys(patch).map((k) => [k, before[k as keyof BookingPatch]]));
      replace(id, (b) => ({ ...b, ...patch }));
      updateBooking(id, patch)
        .then((result) => {
          if (!result.ok) throw new Error(result.error);
        })
        .catch((error: unknown) => {
          replace(id, (b) => ({ ...b, ...previous }));
          toast.error(error instanceof Error && error.message ? error.message : "Couldn't save. Your change was undone.");
        });
    },
    [replace],
  );

  const addCall = useCallback(
    (bookingId: string, input: NewCallAttempt) => {
      const tempId = `pending-${crypto.randomUUID()}`;
      const sortDesc = (a: { attemptedAt: string }, b: { attemptedAt: string }) => b.attemptedAt.localeCompare(a.attemptedAt);
      replace(bookingId, (b) => ({
        ...b,
        callAttempts: [{ id: tempId, ...input }, ...b.callAttempts].sort(sortDesc),
      }));
      addCallAttempt(bookingId, input)
        .then((result) => {
          if (!result.ok) throw new Error(result.error);
          replace(bookingId, (b) => ({
            ...b,
            callAttempts: b.callAttempts.map((c) => (c.id === tempId ? result.data : c)),
          }));
        })
        .catch((error: unknown) => {
          replace(bookingId, (b) => ({ ...b, callAttempts: b.callAttempts.filter((c) => c.id !== tempId) }));
          toast.error(error instanceof Error && error.message ? error.message : "Couldn't log that call.");
        });
    },
    [replace],
  );

  const deleteCall = useCallback(
    (bookingId: string, callId: string) => {
      // A call that hasn't finished saving can't be removed yet.
      if (callId.startsWith("pending-")) return;
      const removed = find(bookingId)?.callAttempts.find((c) => c.id === callId);
      if (!removed) return;
      replace(bookingId, (b) => ({ ...b, callAttempts: b.callAttempts.filter((c) => c.id !== callId) }));
      deleteCallAttempt(callId)
        .then((result) => {
          if (!result.ok) throw new Error(result.error);
        })
        .catch((error: unknown) => {
          replace(bookingId, (b) => ({
            ...b,
            callAttempts: [...b.callAttempts, removed].sort((x, y) => y.attemptedAt.localeCompare(x.attemptedAt)),
          }));
          toast.error(error instanceof Error && error.message ? error.message : "Couldn't remove that call.");
        });
    },
    [replace],
  );

  return { bookings, patchBooking, addCall, deleteCall };
}
