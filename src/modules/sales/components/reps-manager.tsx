"use client";

import { Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { RepDot } from "@/modules/sales/components/rep-label";
import { createRep, deleteRep } from "@/modules/sales/server/actions";
import { REP_COLORS, repColorVar, type RepRow } from "@/modules/sales/types";

export function RepsManager({ initialReps }: { initialReps: RepRow[] }) {
  const [reps, setReps] = useState(initialReps);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState<string>(REP_COLORS[1]);
  const [confirming, setConfirming] = useState<RepRow | null>(null);

  const byName = (a: RepRow, b: RepRow) => a.name.localeCompare(b.name);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const input = { name: name.trim(), email: email.trim().toLowerCase(), color };
    if (!input.name || !input.email) return;
    if (reps.some((r) => r.email === input.email)) {
      toast.error("A rep with that email already exists");
      return;
    }
    // Show it right away; swap in the saved row (with its real id) when the server answers.
    const tempId = `pending-${crypto.randomUUID()}`;
    setReps((list) => [...list, { id: tempId, ...input, bookingCount: 0 }].sort(byName));
    setName("");
    setEmail("");
    createRep(input)
      .then((result) => {
        if (!result.ok) throw new Error(result.error);
        setReps((list) => list.map((r) => (r.id === tempId ? result.data : r)));
      })
      .catch((error: unknown) => {
        setReps((list) => list.filter((r) => r.id !== tempId));
        setName(input.name);
        setEmail(input.email);
        toast.error(error instanceof Error && error.message ? error.message : "Couldn't add that rep.");
      });
  }

  function remove(rep: RepRow) {
    setConfirming(null);
    setReps((list) => list.filter((r) => r.id !== rep.id));
    deleteRep(rep.id)
      .then((result) => {
        if (!result.ok) throw new Error(result.error);
      })
      .catch((error: unknown) => {
        setReps((list) => [...list, rep].sort(byName));
        toast.error(error instanceof Error && error.message ? error.message : "Couldn't remove that rep.");
      });
  }

  return (
    <section className="max-w-2xl rounded-card border">
      <div className="p-card">
        <h2 className="text-lg">Sales reps</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          People who take calls. Bookings are auto-assigned when the Calendly host email matches a rep&apos;s email.
        </p>
      </div>

      {reps.length === 0 ? (
        <div className="flex flex-col items-center border-t px-card py-10 text-center">
          <Users className="size-6 text-subtle" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-muted-foreground">No reps yet. Add your first one below.</p>
        </div>
      ) : (
        <ul className="border-t">
          {reps.map((rep) => (
            <li key={rep.id} className="group flex h-row items-center gap-3 border-b px-card last:border-b-0">
              <RepDot color={rep.color} />
              <span className="font-medium">{rep.name}</span>
              <span className="truncate text-sm text-muted-foreground">{rep.email}</span>
              <span className="ml-auto shrink-0 text-sm text-subtle tabular-nums">
                {rep.bookingCount} {rep.bookingCount === 1 ? "booking" : "bookings"}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${rep.name}`}
                disabled={rep.id.startsWith("pending-")}
                onClick={() => setConfirming(rep)}
                className="text-subtle"
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex flex-col gap-4 border-t bg-surface p-card">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rep-name" className="text-muted-foreground">
              Name
            </Label>
            <Input id="rep-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required className="bg-background" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rep-email" className="text-muted-foreground">
              Email
            </Label>
            <Input
              id="rep-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              required
              className="bg-background"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground" id="rep-color-label">
            Color
          </span>
          <div role="radiogroup" aria-labelledby="rep-color-label" className="flex gap-2">
            {REP_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={c}
                onClick={() => setColor(c)}
                className={cn(
                  "size-7 rounded-full border-2 border-transparent outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50",
                  color === c && "border-background ring-2 ring-foreground/30",
                )}
                style={{ background: repColorVar(c) }}
              />
            ))}
          </div>
        </div>
        <Button type="submit" className="self-start">
          <Plus />
          Add rep
        </Button>
      </form>

      <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirming?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirming && confirming.bookingCount > 0
                ? `Their ${confirming.bookingCount} ${confirming.bookingCount === 1 ? "booking becomes" : "bookings become"} unassigned. No bookings are deleted.`
                : "They have no bookings. Nothing else changes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => confirming && remove(confirming)}>
              Remove rep
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
