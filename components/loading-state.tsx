export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <p className="border-y border-rule py-10 text-sm text-mute" role="status">
      {label}
    </p>
  );
}
