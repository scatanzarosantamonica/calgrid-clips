import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-400 text-white",
        secondary: "border-transparent bg-paper-warm text-ink-light",
        outline: "border-rule text-ink-muted",
        destructive: "border-transparent bg-accent-red text-white",
        success: "border-transparent bg-brand-100 text-brand-700",
        warning: "border-transparent bg-secondary-100 text-secondary-700",
        section: "border-brand-200 bg-brand-50 text-brand-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
