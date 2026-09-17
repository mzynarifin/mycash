import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  framed = true,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  framed?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center",
        framed && "rounded-lg border border-dashed border-border",
        className
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground">
        <Icon size={18} aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-sm font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
