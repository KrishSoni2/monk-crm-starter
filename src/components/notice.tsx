// A quiet, full-width notice bar for setup warnings (not for errors in normal use).
export function Notice({ children }: { children: React.ReactNode }) {
  return <div className="bg-warning px-page py-3 text-sm text-warning-foreground">{children}</div>;
}
