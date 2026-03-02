import { Select, SearchInput } from "@/components/ui";

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function UserFilters({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="w-full sm:w-72">
        <SearchInput
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select
        options={[
          { value: "", label: "All Roles" },
          { value: "STUDENT", label: "Student" },
          { value: "ADMIN", label: "Admin" },
          { value: "SUPER_ADMIN", label: "Super Admin" },
        ]}
        value={roleFilter}
        onChange={(e) => onRoleFilterChange(e.target.value)}
        className="w-full sm:w-40"
      />
      <Select
        options={[
          { value: "", label: "All Status" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="w-full sm:w-40"
      />
    </div>
  );
}
