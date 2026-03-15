import clsx from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={clsx(
          "animate-spin rounded-full border-2 border-slate-600 border-t-primary-400",
          sizeStyles[size],
          className
        )}
      />
    </div>
  );
}
