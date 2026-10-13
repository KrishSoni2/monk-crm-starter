"use client";

import { CalendarClock, Mail, Phone, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cityName, formatDate, formatTime, zoneAbbreviation } from "@/lib/format";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";
import { CallAttempts, type NewCallAttempt } from "@/modules/sales/components/call-attempts";
import { RepDot } from "@/modules/sales/components/rep-label";
import { segmentItemClass } from "@/modules/sales/components/segment";
import { CanceledTag } from "@/modules/sales/components/status-badge";
import { BOARD_COLUMNS, type BookingPatch, type BookingRow, type RepRow } from "@/modules/sales/types";

const UNASSIGNED = "unassigned";


export function BookingPanel({
  booking,
  reps,
  onClose,
  onPatch,
  onAddCall,
  onDeleteCall,
}: {
  booking: BookingRow | null;
  reps: RepRow[];
  onClose: () => void;
  onPatch: (id: string, patch: BookingPatch) => void;
  onAddCall: (bookingId: string, input: NewCallAttempt) => void;
  onDeleteCall: (bookingId: string, callId: string) => void;
}) {
  return (
    <Sheet open={booking !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full gap-0 overflow-y-auto sm:max-w-[480px]"
        // Don't jump focus (and a focus ring) onto the first dropdown when the panel opens.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {booking && (
          <PanelBody
            key={booking.id}
            booking={booking}
            reps={reps}
            onPatch={(patch) => onPatch(booking.id, patch)}
            onAddCall={(input) => onAddCall(booking.id, input)}
            onDeleteCall={(callId) => onDeleteCall(booking.id, callId)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t px-card py-6">
      <h3 className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

function PanelBody({
  booking,
  reps,
  onPatch,
  onAddCall,
  onDeleteCall,
}: {
  booking: BookingRow;
  reps: RepRow[];
  onPatch: (patch: BookingPatch) => void;
  onAddCall: (input: NewCallAttempt) => void;
  onDeleteCall: (callId: string) => void;
}) {
  const myZone = useViewerTimeZone();
  const theirZone = booking.inviteeTimeZone;
  const minutes = Math.round((Date.parse(booking.endTime) - Date.parse(booking.startTime)) / 60000);
  const canceled = booking.canceledAt !== null;

  return (
    <>
      <SheetHeader className="gap-1 px-card pt-card pb-6">
        <SheetTitle className="pr-8 text-xl font-medium">{booking.inviteeName}</SheetTitle>
        <SheetDescription>
          {booking.eventTypeName ?? "Meeting"} · {minutes} min
        </SheetDescription>
        <div className="mt-3 flex flex-col gap-1.5 text-sm">
          <a href={`mailto:${booking.inviteeEmail}`} className="inline-flex items-center gap-2 hover:underline">
            <Mail className="size-4 text-subtle" strokeWidth={1.75} />
            {booking.inviteeEmail}
          </a>
          {booking.inviteePhone && (
            <a href={`tel:${booking.inviteePhone}`} className="inline-flex items-center gap-2 hover:underline">
              <Phone className="size-4 text-subtle" strokeWidth={1.75} />
              {booking.inviteePhone}
            </a>
          )}
        </div>
      </SheetHeader>

      {/* Time zones side by side */}
      <div className="grid grid-cols-2 gap-4 px-card pb-6">
        <TimeBlock label="Their time" iso={booking.startTime} zone={theirZone} />
        <TimeBlock label="Your time" iso={booking.startTime} zone={myZone} />
      </div>

      <div className="flex flex-wrap gap-2 px-card pb-6">
        {booking.joinUrl && !canceled && (
          <Button asChild>
            <a href={booking.joinUrl} target="_blank" rel="noopener noreferrer">
              <Video />
              Join call
            </a>
          </Button>
        )}
        {booking.rescheduleUrl && !canceled && (
          <Button variant="outline" asChild>
            <a href={booking.rescheduleUrl} target="_blank" rel="noopener noreferrer">
              <CalendarClock />
              Reschedule
            </a>
          </Button>
        )}
      </div>

      {canceled && booking.canceledAt && (
        <div className="mx-card mb-6 rounded-card bg-inset p-4 text-sm">
          <div className="flex items-center gap-2">
            <CanceledTag />
            <span className="text-muted-foreground">
              {myZone ? formatDate(booking.canceledAt, myZone) : ""}
              {booking.canceledBy ? ` by ${booking.canceledBy}` : ""}
            </span>
          </div>
          <p className="mt-2">{booking.cancelReason ?? "No reason given."}</p>
        </div>
      )}

      <Section title="Pipeline">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Rep</Label>
            <Select
              value={booking.repId ?? UNASSIGNED}
              onValueChange={(v) => onPatch({ repId: v === UNASSIGNED ? null : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {reps.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <RepDot color={r.color} />
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Status</Label>
            <Select value={booking.status} onValueChange={(v) => onPatch({ status: v as BookingRow["status"] })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOARD_COLUMNS.map((c) => (
                  <SelectItem key={c.status} value={c.status}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Label className="text-muted-foreground">Qualified</Label>
          <ToggleGroup
            type="single"
            value={booking.qualified === null ? "unknown" : booking.qualified ? "yes" : "no"}
            onValueChange={(v) => v && onPatch({ qualified: v === "unknown" ? null : v === "yes" })}
          >
            <ToggleGroupItem value="yes" className={segmentItemClass}>
              Yes
            </ToggleGroupItem>
            <ToggleGroupItem value="no" className={segmentItemClass}>
              No
            </ToggleGroupItem>
            <ToggleGroupItem value="unknown" className={segmentItemClass}>
              Not yet
            </ToggleGroupItem>
          </ToggleGroup>
          <ReasonField value={booking.qualifiedReason} onSave={(qualifiedReason) => onPatch({ qualifiedReason })} />
        </div>
      </Section>

      <Section title={`Call attempts (${booking.callAttempts.length})`}>
        <CallAttempts
          attempts={booking.callAttempts}
          reps={reps}
          defaultRepId={booking.repId}
          onAdd={onAddCall}
          onDelete={onDeleteCall}
        />
      </Section>

      <Section title="Booking form answers">
        {booking.questions.length === 0 ? (
          <p className="text-sm text-subtle">No questions were answered.</p>
        ) : (
          <dl className="flex flex-col gap-4 text-sm">
            {booking.questions.map((q, i) => (
              <div key={i}>
                <dt className="text-muted-foreground">{q.question}</dt>
                <dd className="mt-1 whitespace-pre-wrap">{q.answer || "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </Section>

      <Section title="Notes">
        <NotesField value={booking.notes} onSave={(notes) => onPatch({ notes })} />
      </Section>
    </>
  );
}

function TimeBlock({ label, iso, zone }: { label: string; iso: string; zone: string | null }) {
  return (
    <div className="rounded-card bg-inset p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      {zone ? (
        <>
          <p className="mt-1 text-lg font-medium tabular-nums">{formatTime(iso, zone)}</p>
          <p className="text-sm text-muted-foreground">{formatDate(iso, zone)}</p>
          <p className="mt-1 truncate text-xs text-subtle" title={zone}>
            {cityName(zone)} · {zoneAbbreviation(iso, zone)}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-subtle">{label === "Their time" ? "Time zone unknown" : ""}</p>
      )}
    </div>
  );
}

function ReasonField({ value, onSave }: { value: string | null; onSave: (value: string | null) => void }) {
  const [draft, setDraft] = useState(value ?? "");
  const save = () => {
    const next = draft.trim() || null;
    if (next !== value) onSave(next);
  };
  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
      placeholder="Reason, e.g. budget approved, decision maker"
      maxLength={500}
      className="mt-2"
    />
  );
}

// Saves 800ms after you stop typing, and when you click away or close the panel.
function NotesField({ value, onSave }: { value: string | null; onSave: (value: string | null) => void }) {
  const [draft, setDraft] = useState(value ?? "");
  const [state, setState] = useState<"idle" | "pending" | "saved">("idle");
  const saved = useRef(value ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ draft, onSave });
  latest.current = { draft, onSave };

  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const { draft: current, onSave: save } = latest.current;
    if (current === saved.current) return;
    saved.current = current;
    save(current.trim() || null);
    setState("saved");
  };

  // Save anything unsaved when the panel closes or switches booking.
  useEffect(() => () => flush(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <Textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setState("pending");
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(flush, 800);
        }}
        onBlur={flush}
        placeholder="Anything the team should know"
        maxLength={10000}
        className="min-h-28"
      />
      <p className="mt-2 h-4 text-xs text-subtle" aria-live="polite">
        {state === "pending" ? "Saving…" : state === "saved" ? "Saved" : ""}
      </p>
    </div>
  );
}

