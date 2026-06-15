"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[13px] font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] uppercase tracking-[0.2em] italic",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary hover:bg-accent",
        destructive:
          "bg-status-error text-white hover:bg-status-error/90",
        outline:
          "border border-on-background/20 bg-transparent hover:bg-on-background/5 text-primary",
        secondary:
          "bg-on-background/5 text-primary hover:bg-on-background/10",
        ghost: "hover:bg-on-background/5 text-primary",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-14 px-12 py-2",
        sm: "h-11 px-8 text-[11px]",
        lg: "h-20 px-20 text-base",
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
