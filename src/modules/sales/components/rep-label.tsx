import { repColorVar } from "@/modules/sales/types";

export function RepDot({ color }: { color: string }) {
  return <span aria-hidden className="inline-block size-2 shrink-0 rounded-full" style={{ background: repColorVar(color) }} />;
}

export function RepLabel({ rep }: { rep: { name: string; color: string } | undefined }) {
  if (!rep) return <span className="text-subtle">Unassigned</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <RepDot color={rep.color} />
      {rep.name}
    </span>
  );
}
