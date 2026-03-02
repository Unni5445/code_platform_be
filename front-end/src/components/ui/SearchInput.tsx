import { type InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export function SearchInput({ className, onChange, onSearch, ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        className={clsx(
          "w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
          "placeholder:text-gray-400 hover:border-gray-400 transition-colors duration-200",
          className
        )}
        onChange={(e) => {
          onChange?.(e);
          onSearch?.(e.target.value);
        }}
        {...props}
      />
    </div>
  );
}
