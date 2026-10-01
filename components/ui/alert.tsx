import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-md border px-4 py-3 text-sm", {
  variants: {
    variant: {
      default: "bg-card text-foreground",
      info: "border-rule bg-surface text-ink",
      success: "border-rule bg-surface text-ink",
      warning: "border-warning/50 bg-warning/10 text-foreground",
      destructive: "border-destructive/40 bg-destructive/5 text-destructive",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Alert({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div role="status" className={cn(alertVariants({ variant }), className)} {...props} />;
}
