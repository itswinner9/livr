import type { IssueMention } from "@/types/property";

export function PropertyIssues({ issues }: { issues: IssueMention[] }) {
  if (issues.length === 0) {
    return <p className="text-sm text-mute">No commonly reported topics yet.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {issues.map((issue) => (
        <li
          key={issue.topic}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-md bg-muted px-3 text-sm capitalize text-ink"
        >
          <span>{issue.topic.replace(/_/g, " ")}</span>
          <span className="figure text-mute">{issue.mentions}</span>
        </li>
      ))}
    </ul>
  );
}
