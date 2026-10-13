"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// The viewer's own time zone ("my time"), from their browser. Returns null during the
// server render, so times are only formatted once we know the right zone (this avoids
// a flash of wrong times and React hydration warnings).
export function useViewerTimeZone(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null,
  );
}
