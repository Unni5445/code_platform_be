import clsx from "clsx";

type BadgeVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "gray";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary-500/25 text-primary-200 border border-primary-500/40",
  secondary: "bg-secondary-500/25 text-secondary-200 border border-secondary-500/40",
  success: "bg-emerald-500/25 text-emerald-200 border border-emerald-500/40",
  danger: "bg-red-500/25 text-red-200 border border-red-500/40",
  warning: "bg-amber-500/25 text-amber-200 border border-amber-500/40",
  info: "bg-sky-500/25 text-sky-200 border border-sky-500/40",
  gray: "bg-slate-600/40 text-slate-300 border border-slate-500/40",
};

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
