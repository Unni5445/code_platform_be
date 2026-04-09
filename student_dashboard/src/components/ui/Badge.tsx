import clsx from "clsx";

type BadgeVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "gray";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary-50 text-primary-700 border border-primary-100",
  secondary: "bg-secondary-50 text-secondary-700 border border-secondary-100",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  danger: "bg-red-50 text-red-700 border border-red-100",
  warning: "bg-amber-50 text-amber-700 border border-amber-100",
  info: "bg-sky-50 text-sky-700 border border-sky-100",
  gray: "bg-slate-100 text-slate-600 border border-slate-200",
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
