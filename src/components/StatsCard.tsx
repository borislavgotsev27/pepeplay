import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "gold" | "primary";
}

export const StatsCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatsCardProps) => {
  const variantStyles = {
    default: "border-border",
    gold: "border-earnings-gold/20 glow-gold",
    primary: "border-primary/20 glow-primary",
  };
  
  return (
    <Card className={`p-6 gradient-card ${variantStyles[variant]} transition-all hover:scale-105`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className={`text-3xl font-bold ${variant === "gold" ? "text-earnings-gold" : variant === "primary" ? "text-primary" : ""}`}>
            {value}
          </h3>
          {trend && (
            <p className="text-xs text-primary mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${variant === "gold" ? "bg-earnings-gold/10" : variant === "primary" ? "bg-primary/10" : "bg-muted"}`}>
          <Icon className={`w-6 h-6 ${variant === "gold" ? "text-earnings-gold" : variant === "primary" ? "text-primary" : "text-muted-foreground"}`} />
        </div>
      </div>
    </Card>
  );
};
