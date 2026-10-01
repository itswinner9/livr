export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div role="alert" className="border-y border-rule py-6">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-mute">{description}</p>
    </div>
  );
}
