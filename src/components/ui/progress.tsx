"use client";

import { Progress as BaseProgress } from "@base-ui/react/progress";
import { cn } from "cn";

function Progress({
  value,
  className,
  indicatorClassName,
  max = 100,
  ...props
}: React.ComponentProps<typeof BaseProgress.Root> & {
  value: number;
  indicatorClassName?: string;
}) {
  return (
    <BaseProgress.Root
      value={value}
      max={max}
      aria-label="Progress"
      role="progressbar"
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-4xl bg-secondary",
        className
      )}
      {...props}
    >
      <BaseProgress.Track className="absolute inset-0 rounded-4xl" />
      <BaseProgress.Indicator
        className={cn(
          "h-full w-full rounded-4xl bg-primary transition-[width] duration-200 ease-out",
          indicatorClassName
        )}
      />
    </BaseProgress.Root>
  );
}

export { Progress };