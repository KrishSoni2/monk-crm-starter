// A quiet, full-width notice bar for setup warnings (not for errors in normal use).
export function Notice({ children }: { children: React.ReactNode }) {
  return <div className="bg-warning-bg px-page py-3 text-sm text-warning-text">{children}</div>;
}
