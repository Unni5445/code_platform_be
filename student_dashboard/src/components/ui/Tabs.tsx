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
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
            activeTab === tab.id
              ? "bg-white text-primary-700 border border-primary-100 shadow-sm"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={clsx(
                "ml-2 px-2 py-0.5 rounded-full text-xs font-bold",
                activeTab === tab.id
                  ? "bg-primary-100 text-primary-700"
                  : "bg-slate-200 text-slate-500"
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
