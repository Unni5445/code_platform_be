import clsx from "clsx";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl w-fit border border-slate-700/60">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
            activeTab === tab.id
              ? "bg-primary-500/30 text-white border border-primary-500/50 shadow-lg shadow-primary-500/10"
              : "text-slate-400 hover:text-white hover:bg-slate-700/50"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={clsx(
                "ml-2 px-2 py-0.5 rounded-full text-xs",
                activeTab === tab.id
                  ? "bg-primary-500/40 text-white"
                  : "bg-slate-700/80 text-slate-400"
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
