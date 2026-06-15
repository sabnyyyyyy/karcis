import React from "react";
import { ShieldCheck, TrendingUp, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustLevel = "Gold" | "Silver" | "Suspended";

interface TrustScoreProps {
  score: number;
  showLevel?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const TrustScore = ({ 
  score, 
  showLevel = true, 
  className,
  size = "sm"
}: TrustScoreProps) => {
  // Trust Levels: Gold > 80, Silver 40-80, Suspended < 40
  const level: TrustLevel = score > 80 ? "Gold" : score >= 40 ? "Silver" : "Suspended";
  
  const config = {
    Gold: {
      color: "text-primary",
      bgColor: "bg-primary/5",
      borderColor: "border-primary/10",
      icon: ShieldCheck,
      label: "Gold"
    },
    Silver: {
      color: "text-status-info",
      bgColor: "bg-status-info/5",
      borderColor: "border-status-info/10",
      icon: ShieldCheck,
      label: "Silver"
    },
    Suspended: {
      color: "text-status-error",
      bgColor: "bg-status-error/5",
      borderColor: "border-status-error/10",
      icon: ShieldAlert,
      label: "Suspended"
    }
  };

  const { color, bgColor, borderColor, icon: Icon, label } = config[level];

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className={cn(
        "flex items-center space-x-1.5 px-3 py-1 border transition-all duration-300",
        bgColor,
        borderColor,
        size === "md" && "px-4 py-1.5",
        size === "lg" && "px-6 py-2"
      )}>
        <Icon className={cn(
          "w-3 h-3",
          color,
          size === "md" && "w-3.5 h-3.5",
          size === "lg" && "w-4 h-4"
        )} />
        <span className={cn(
          "font-black uppercase tracking-[0.2em]",
          color,
          size === "sm" ? "text-[8px]" : size === "lg" ? "text-[10px]" : "text-[9px]"
        )}>
          Trust {score}
        </span>
      </div>
      {showLevel && (
        <span className={cn(
          "font-black uppercase tracking-widest opacity-60 italic",
          color,
          size === "sm" ? "text-[7px]" : size === "lg" ? "text-[9px]" : "text-[8px]"
        )}>
          {label}
        </span>
      )}
    </div>
  );
};
