import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes } from "react";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-sm border border-rule bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-mute focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
      {...props}
    />
  );
}
