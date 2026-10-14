"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime, toLocalInputValue } from "@/lib/format";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";
import { cn } from "@/lib/utils";
import { RepLabel } from "@/modules/sales/components/rep-label";
import type { CallAttemptRow, RepRow } from "@/modules/sales/types";

export type NewCallAttempt = { attemptedAt: string; answered: boolean; note: string | null; repId: string | null };


export function CallAttempts({
  attempts,
  reps,
  defaultRepId,
  onAdd,
  onDelete,
}: {
  attempts: CallAttemptRow[];
  reps: RepRow[];
  defaultRepId: string | null;
  onAdd: (input: NewCallAttempt) => void;
  onDelete: (id: string) => void;
}) {
  const myZone = useViewerTimeZone();
  const repsById = new Map(reps.map((r) => [r.id, r]));
  const [when, setWhen] = useState(() => toLocalInputValue(new Date()));
  const [answered, setAnswered] = useState<"yes" | "no" | "">("");
  const [note, setNote] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!answered || !when) return;
    onAdd({
      // The input is in the viewer's local time; new Date() reads it that way.
      attemptedAt: new Date(when).toISOString(),
      answered: answered === "yes",
      note: note.trim() || null,
      repId: defaultRepId,
    });
    setAnswered("");
    setNote("");
    setWhen(toLocalInputValue(new Date()));
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 basis-52 flex-col gap-2">
            <Label htmlFor="call-when" className="text-xs font-medium text-muted-foreground">
              When
            </Label>
            <Input
              id="call-when"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="bg-card"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Answered?</span>
            <Tabs value={answered} onValueChange={(v) => setAnswered(v as "yes" | "no")}>
              <TabsList aria-label="Answered?">
                <TabsTrigger value="yes" className="px-4">Yes</TabsTrigger>
                <TabsTrigger value="no" className="px-4">No</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional), e.g. voicemail, call back Friday"
          maxLength={500}
          className="bg-card"
        />
        <Button type="submit" variant="outline" size="sm" disabled={!answered} className="self-start">
          Log call
        </Button>
      </form>

      {attempts.length === 0 ? (
        <p className="text-sm text-subtle">No calls logged yet.</p>
      ) : (
        <ul className="flex flex-col">
          {attempts.map((a) => (
            <li key={a.id} className="group flex items-start gap-3 border-b py-3 last:border-b-0">
              <span
                aria-hidden
                className={cn("mt-1.5 size-2 shrink-0 rounded-full", a.answered ? "bg-positive" : "bg-subtle")}
              />
              <div className="min-w-0 flex-1 text-sm">
                <p>
                  <span className="font-medium">{a.answered ? "Answered" : "No answer"}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {" "}
                    · {myZone ? formatDateTime(a.attemptedAt, myZone) : ""}
                  </span>
                </p>
                {a.note && <p className="mt-0.5 text-muted-foreground">{a.note}</p>}
                {a.repId && (
                  <p className="mt-0.5 text-xs text-subtle">
                    <RepLabel rep={repsById.get(a.repId)} />
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove this call"
                onClick={() => onDelete(a.id)}
                className="text-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
