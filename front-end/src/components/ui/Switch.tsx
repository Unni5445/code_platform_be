import React from "react";
import clsx from "clsx";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled }) => {
  return (
    <label className={clsx("flex items-center gap-3", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 outline-none ring-offset-2 focus:ring-2 focus:ring-primary-500",
          checked ? "bg-primary-600" : "bg-gray-200"
        )}
      >
        <span
          className={clsx(
            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-sm",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </label>
  );
};
