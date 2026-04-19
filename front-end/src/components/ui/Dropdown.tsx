import { useState, useRef, useEffect, useLayoutEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import clsx from "clsx";

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
}

export function Dropdown({ items }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const menuHeight = items.length * 40 + 8;
      const menuWidth = 192; // Default w-48
      
      const spaceBelow = windowHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight && rect.top > menuHeight;
      
      // Horizontal positioning with boundary check
      let left = rect.right - menuWidth;
      if (left < 16) left = 16; // Minimum 16px from left edge
      if (left + menuWidth > windowWidth - 16) left = windowWidth - menuWidth - 16;
      
      return {
        top: openUp ? rect.top : rect.bottom,
        left,
        openUp
      };
    }
    return null;
  };

  const handleToggle = () => {
    if (!isOpen) {
      const initialCoords = calculatePosition();
      setCoords(initialCoords);
    }
    setIsOpen(!isOpen);
  };

  useLayoutEffect(() => {
    if (isOpen) {
      const update = () => {
        const newCoords = calculatePosition();
        setCoords(newCoords);
      };
      
      update();
      window.addEventListener("scroll", update, true);
      window.addEventListener("resize", update);
      
      return () => {
        window.removeEventListener("scroll", update, true);
        window.removeEventListener("resize", update);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={handleToggle}
        className={clsx(
          "p-1.5 rounded-lg transition-colors cursor-pointer",
          isOpen ? "text-primary-600 bg-primary-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.openUp ? "auto" : `${coords.top + 4}px`,
              bottom: coords.openUp ? `${window.innerHeight - coords.top + 4}px` : "auto",
              left: `${coords.left}px`,
              width: "192px",
            }}
            className="bg-white rounded-xl shadow-xl border border-surface-border py-1 z-[9999] animate-in fade-in zoom-in duration-100"
          >
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors cursor-pointer text-left",
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
