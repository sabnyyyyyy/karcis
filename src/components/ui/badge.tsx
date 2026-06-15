import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-3 py-1 text-[11px] font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-0 italic",
  {
    variants: {
      variant: {
        default:
          "border-on-background/10 bg-on-background/5 text-primary",
        secondary:
          "border-accent/20 bg-accent/5 text-accent",
        destructive:
          "border-status-error/20 bg-status-error/5 text-status-error",
        outline: "border-on-background/10 text-text-muted hover:text-primary hover:border-primary",
        premium: "border-accent bg-accent/10 text-accent shadow-sm",
        teal: "border-accent-teal/20 bg-accent-teal/10 text-accent-teal",
        mint: "border-accent-mint/20 bg-accent-mint/10 text-accent-mint",
        peach: "border-accent-peach/20 bg-accent-peach/10 text-accent-peach",
        coral: "border-accent-coral/20 bg-accent-coral/10 text-accent-coral",
        lavender: "border-accent-lavender/20 bg-accent-lavender/10 text-accent-lavender",
        olive: "border-accent-olive/20 bg-accent-olive/10 text-accent-olive",
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
