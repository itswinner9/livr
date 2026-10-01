import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md";
}) {
  const styles = {
    primary: "bg-accent text-paper hover:bg-accent-hover",
    secondary: "border border-rule bg-surface text-ink hover:bg-white/5",
    outline: "border border-rule bg-surface text-ink hover:bg-white/5",
    ghost: "text-ink hover:bg-white/5",
    danger: "bg-destructive text-ink hover:bg-destructive/80",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-md text-sm font-medium duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5" : "px-4 py-2.5",
        styles,
        className,
      )}
      {...props}
    />
  );
}
