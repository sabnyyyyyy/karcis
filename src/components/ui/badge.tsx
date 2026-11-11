import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest transition-colors focus:outline-none focus:ring-0",
  {
    variants: {
      variant: {
        default:
          "border-on-background/10 bg-on-background/5 text-primary",
        secondary:
          "border-accent/40 bg-accent/10 text-accent-ink",
        destructive:
          "border-status-error/20 bg-status-error/5 text-status-error",
        outline: "border-on-background/15 text-text-muted hover:text-primary hover:border-primary",
        premium: "border-accent bg-accent text-[#141414] shadow-sm",
        teal: "border-accent/60 bg-accent text-[#141414]",
        mint: "border-accent-mint/30 bg-accent-mint/10 text-accent-ink",
        peach: "border-accent-peach/40 bg-accent-peach/20 text-[#4a5e00]",
        coral: "border-accent-coral/20 bg-accent-coral/10 text-accent-coral",
        lavender: "border-accent-lavender/60 bg-accent-lavender/40 text-[#3a5a00]",
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
