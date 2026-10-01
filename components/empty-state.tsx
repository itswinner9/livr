export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-8">
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? <p className="mt-2 max-w-xl text-sm text-mute">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
