"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] uppercase tracking-[0.12em]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary hover:bg-accent hover:text-[#141414]",
        lime:
          "bg-accent text-[#141414] hover:shadow-[0_0_40px_rgba(156,255,30,0.55)]",
        destructive:
          "bg-status-error text-white hover:bg-status-error/90",
        outline:
          "border border-on-background/20 bg-transparent hover:bg-accent hover:border-accent hover:text-[#141414] text-primary",
        secondary:
          "bg-on-background/5 text-primary hover:bg-on-background/10",
        ghost: "hover:bg-on-background/5 text-primary",
        link: "text-accent-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-14 px-10 py-2",
        sm: "h-11 px-7 text-[11px]",
        lg: "h-16 px-14 text-sm",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
