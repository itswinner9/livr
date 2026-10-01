import { cn } from "@/lib/utils";

const WIDTH = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
} as const;

export function PageShell({
  children,
  width = "md",
  className,
}: {
  children: React.ReactNode;
  width?: keyof typeof WIDTH;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 py-10 sm:px-6", WIDTH[width], className)}>
      {children}
    </div>
  );
}

export function PageHeading({ title, lede }: { title: string; lede?: string }) {
  return (
    <header className="border-b border-rule pb-4">
      <h1 className="text-3xl font-semibold text-ink">{title}</h1>
      {lede ? <p className="mt-2 max-w-xl text-sm leading-6 text-mute">{lede}</p> : null}
    </header>
  );
}
