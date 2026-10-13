"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Phone } from "lucide-react";
import { useState } from "react";
import type { BookingStatus } from "@/generated/prisma/enums";
import { formatDateTime } from "@/lib/format";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";
import { cn } from "@/lib/utils";
import { RepLabel } from "@/modules/sales/components/rep-label";
import { BOARD_COLUMNS, STATUS_LABELS, type BookingRow, type RepRow } from "@/modules/sales/types";

type CardProps = { booking: BookingRow; rep: RepRow | undefined; myZone: string | null };

function CardContent({ booking, rep, myZone }: CardProps) {
  return (
    <>
      <p className="truncate font-medium">{booking.inviteeName}</p>
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
        {myZone ? formatDateTime(booking.startTime, myZone) : " "}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">
          <RepLabel rep={rep} />
        </span>
        {booking.callAttempts.length > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 tabular-nums" title="Call attempts">
            <Phone className="size-3" strokeWidth={1.75} />
            {booking.callAttempts.length}
          </span>
        )}
      </div>
    </>
  );
}

const cardClass = "w-full rounded-lg border bg-card p-3 text-left text-sm";

function DraggableCard({
  selected,
  onSelect,
  ...props
}: CardProps & { selected: boolean; onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.booking.id });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => onSelect(props.booking.id)}
      aria-label={`${props.booking.inviteeName}, ${STATUS_LABELS[props.booking.status]}. Press space to move.`}
      className={cn(
        cardClass,
        "cursor-grab touch-none transition-[border-color,opacity] hover:border-foreground/20 active:cursor-grabbing",
        selected && "border-foreground/30",
        // The card stays in place, faded, while its lifted copy follows the pointer.
        isDragging && "opacity-40",
      )}
    >
      <CardContent {...props} />
    </button>
  );
}

function Column({ status, label, count, children }: { status: BookingStatus; label: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      data-board-column={status}
      className={cn(
        "flex min-h-64 w-60 shrink-0 flex-col rounded-card bg-surface p-2 transition-colors",
        isOver && "bg-accent",
      )}
    >
      <div className="flex items-center justify-between px-2 pt-1 pb-3">
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-xs text-subtle tabular-nums">{count}</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

// Booked: soonest first. Every other column: most recent first.
function sortForColumn(status: BookingStatus, list: BookingRow[]) {
  return [...list].sort((a, b) =>
    status === "BOOKED" ? a.startTime.localeCompare(b.startTime) : b.startTime.localeCompare(a.startTime),
  );
}

export function BookingsBoard({
  bookings,
  repsById,
  selectedId,
  onSelect,
  onMove,
}: {
  bookings: BookingRow[];
  repsById: Map<string, RepRow>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, status: BookingStatus) => void;
}) {
  const myZone = useViewerTimeZone();
  const [activeId, setActiveId] = useState<string | null>(null);
  // A small movement threshold so a plain click opens the panel instead of starting a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const active = bookings.find((b) => b.id === activeId);

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const id = String(event.active.id);
    const target = event.over?.id as BookingStatus | undefined;
    const booking = bookings.find((b) => b.id === id);
    if (booking && target && booking.status !== target) onMove(id, target);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: {
          onDragStart: () => "Picked up booking.",
          onDragOver: ({ over }) => (over ? `Over ${STATUS_LABELS[over.id as BookingStatus]}.` : "Not over a column."),
          onDragEnd: ({ over }) => (over ? `Moved to ${STATUS_LABELS[over.id as BookingStatus]}.` : "Dropped. Nothing changed."),
          onDragCancel: () => "Move canceled.",
        },
      }}
    >
      <div className="-mx-1 overflow-x-auto px-1 pb-2">
        <div className="flex gap-3">
          {BOARD_COLUMNS.map((col) => {
            const cards = sortForColumn(
              col.status,
              bookings.filter((b) => b.status === col.status),
            );
            return (
              <Column key={col.status} status={col.status} label={col.label} count={cards.length}>
                {cards.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-subtle">Drop a booking here</p>
                ) : (
                  cards.map((b) => (
                    <DraggableCard
                      key={b.id}
                      booking={b}
                      rep={b.repId ? repsById.get(b.repId) : undefined}
                      myZone={myZone}
                      selected={b.id === selectedId}
                      onSelect={onSelect}
                    />
                  ))
                )}
              </Column>
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {active ? (
          <div className={cn(cardClass, "cursor-grabbing border-foreground/20 shadow-sm")}>
            <CardContent booking={active} rep={active.repId ? repsById.get(active.repId) : undefined} myZone={myZone} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
