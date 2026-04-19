import { Search, RotateCcw } from "lucide-react";
import { Input, Select, Button } from "@/components/ui";

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function UserFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name or email..."
          className="pl-10 h-10"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select
        options={[
          { value: "", label: "All Status" },
          { value: "active", label: "Active Only" },
          { value: "inactive", label: "Inactive Only" },
        ]}
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="w-full sm:w-40"
      />

      {(search || statusFilter) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSearchChange("");
            onStatusFilterChange("");
          }}
          className="h-10 px-3 text-gray-500 hover:text-gray-900"
          leftIcon={<RotateCcw className="h-4 w-4" />}
        >
          Reset
        </Button>
      )}
    </div>
  );
}
