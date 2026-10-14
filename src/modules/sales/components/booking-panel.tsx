"use client";

import { CalendarClock, Clock, Mail, Phone, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cityName, formatDate, formatTime, zoneAbbreviation } from "@/lib/format";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";
import { CallAttempts, type NewCallAttempt } from "@/modules/sales/components/call-attempts";
import { InitialsAvatar } from "@/modules/sales/components/rep-label";
import { CanceledTag, StatusBadge } from "@/modules/sales/components/status-badge";
import { BOARD_COLUMNS, type BookingPatch, type BookingRow, type RepRow } from "@/modules/sales/types";

// AI-GUIDE: The booking side panel. Each block is a <Section title="...">. To add one,
// copy a Section in PanelBody and save changes through onPatch (see server/actions.ts).
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
    // Non-modal: the table and board stay usable behind the panel. Clicking another
    // booking switches the panel to it; Escape or the close button closes it.
    <Sheet open={booking !== null} onOpenChange={(open) => !open && onClose()} modal={false}>
      <SheetContent
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl"
        // Don't jump focus (and a focus ring) onto the first dropdown when the panel opens.
        onOpenAutoFocus={(e) => e.preventDefault()}
        // Clicks outside (e.g. on another row) shouldn't close the panel.
        onInteractOutside={(e) => e.preventDefault()}
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
    <section className="space-y-4">
      <Separator />
      <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
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
      <SheetHeader className="gap-0 px-6 pt-6 pr-12 pb-4">
        <div className="flex items-center gap-3">
          <InitialsAvatar name={booking.inviteeName} className="size-10" />
          <div className="min-w-0">
            <SheetTitle className="truncate text-xl">{booking.inviteeName}</SheetTitle>
            <SheetDescription className="mt-0.5">
              {booking.eventTypeName ?? "Meeting"} · {minutes} min
            </SheetDescription>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <StatusBadge status={booking.status} />
          {canceled && <CanceledTag />}
        </div>
      </SheetHeader>

      <div className="space-y-6 px-6 pb-6">
        {/* Their time and your time side by side */}
        <div className="grid grid-cols-2 gap-3">
          <TimeBlock label="Their time" iso={booking.startTime} zone={theirZone} />
          <TimeBlock label="Your time" iso={booking.startTime} zone={myZone} />
        </div>

        {(booking.joinUrl || booking.rescheduleUrl) && !canceled && (
          <div className="flex flex-wrap gap-2">
            {booking.joinUrl && (
              <Button asChild>
                <a href={booking.joinUrl} target="_blank" rel="noopener noreferrer">
                  <Video />
                  Join call
                </a>
              </Button>
            )}
            {booking.rescheduleUrl && (
              <Button variant="outline" asChild>
                <a href={booking.rescheduleUrl} target="_blank" rel="noopener noreferrer">
                  <CalendarClock />
                  Reschedule
                </a>
              </Button>
            )}
          </div>
        )}

        {canceled && booking.canceledAt && (
          <div className="rounded-lg border border-status-canceled-foreground/20 bg-status-canceled/40 p-4 text-sm">
            <p className="font-medium text-status-canceled-foreground">
              Canceled {myZone ? formatDate(booking.canceledAt, myZone) : ""}
              {booking.canceledBy ? ` by ${booking.canceledBy}` : ""}
            </p>
            <p className="mt-1 text-foreground">{booking.cancelReason ?? "No reason given."}</p>
          </div>
        )}

        <Section title="Contact">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <a href={`mailto:${booking.inviteeEmail}`} className="truncate text-primary hover:underline">
                {booking.inviteeEmail}
              </a>
            </div>
            {booking.inviteePhone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                <a href={`tel:${booking.inviteePhone}`} className="text-primary hover:underline">
                  {booking.inviteePhone}
                </a>
              </div>
            )}
            {theirZone && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0" />
                {theirZone}
              </div>
            )}
          </div>
        </Section>

      <Section title="Pipeline">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Rep</Label>
            <Select
              value={booking.repId ?? UNASSIGNED}
              onValueChange={(v) => onPatch({ repId: v === UNASSIGNED ? null : v })}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {reps.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex items-center gap-2">
                      <InitialsAvatar name={r.name} color={r.color} className="size-5 [&_[data-slot=avatar-fallback]]:text-[10px]" />
                      {r.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Status</Label>
            <Select value={booking.status} onValueChange={(v) => onPatch({ status: v as BookingRow["status"] })}>
              <SelectTrigger className="h-9 w-full">
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

        <div className="mt-4 flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Qualified</Label>
          <Tabs
            value={booking.qualified === null ? "unknown" : booking.qualified ? "yes" : "no"}
            onValueChange={(v) => onPatch({ qualified: v === "unknown" ? null : v === "yes" })}
          >
            <TabsList aria-label="Qualified">
              <TabsTrigger value="yes" className="px-4">Yes</TabsTrigger>
              <TabsTrigger value="no" className="px-4">No</TabsTrigger>
              <TabsTrigger value="unknown" className="px-4">Not yet</TabsTrigger>
            </TabsList>
          </Tabs>
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
          <dl className="space-y-4 rounded-lg border bg-muted/30 p-4 text-sm">
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
      </div>
    </>
  );
}

function TimeBlock({ label, iso, zone }: { label: string; iso: string; zone: string | null }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-section-label text-muted-foreground">{label}</p>
      {zone ? (
        <>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatTime(iso, zone)}</p>
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

