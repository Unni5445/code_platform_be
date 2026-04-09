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
        "rounded-xl shadow-sm border border-slate-200 bg-white/80 backdrop-blur-sm",
        className
      )}
    >
      {header && (
        <div className="px-6 py-4 border-b border-slate-100">
          {header}
        </div>
      )}
      <div className={clsx(!noPadding && "p-6")}>{children}</div>
    </div>
  );
}
