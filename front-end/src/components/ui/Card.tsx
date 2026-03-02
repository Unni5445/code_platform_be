import { type ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  noPadding?: boolean;
}

export function Card({ children, className, header, noPadding }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-surface rounded-xl shadow-card border border-surface-border",
        className
      )}
    >
      {header && (
        <div className="px-6 py-4 border-b border-surface-border">
          {header}
        </div>
      )}
      <div className={clsx(!noPadding && "p-6")}>{children}</div>
    </div>
  );
}
