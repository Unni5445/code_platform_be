import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { UserPlus, Edit, Trash2, Eye, Download, Upload, FileUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { organisationService, userService } from "@/services"; // Added organizationService
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks";
import { Button, Badge, Modal, ConfirmDialog, Pagination, Avatar, Dropdown, EmptyState, Spinner, Select } from "@/components/ui"; // Added Select
import { UserFilters } from "@/components/users/UserFilters";
import { UserForm } from "@/components/users/UserForm";
import { useModal } from "@/hooks";
import type { IUser, UserRole } from "@/types";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const roleBadgeVariant: Record<UserRole, "primary" | "secondary" | "info"> = {
  SUPER_ADMIN: "primary",
  ADMIN: "secondary",
  STUDENT: "info",
};

const PAGE_SIZE = 8;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  // Distinguish roles
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isAdmin = currentUser?.role === "ADMIN";
  
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const role = searchParams.get("role") || "";
    setRoleFilter(role);
    setCurrentPage(1);
  }, [searchParams]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<IUser | null>(null);

  const addModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  const viewModal = useModal();
  const bulkUploadModal = useModal();

  // Bulk upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkParsed, setBulkParsed] = useState<Partial<IUser>[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(""); // State for organization dropdown

  const debouncedSearch = useDebounce(search, 300);

  // Fetch Organizations for the dropdown
  const { data: organisations } = useApi(
    () => organisationService.getOrganisations(),
    []
  );

  const organizations = organisations ?? [];

  const fetchUsers = useCallback(
    () =>
      userService.getUsers({
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: isAdmin ? "STUDENT" : (roleFilter || undefined),
      }),
    [currentPage, debouncedSearch, roleFilter, isAdmin]
  );

  const { data, loading, refetch } = useApi(fetchUsers, [currentPage, debouncedSearch, roleFilter]);

  const users = data?.users ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalUsers = data?.totalUsers ?? 0;

  // Client-side status filter
  const filteredUsers = statusFilter
    ? users.filter((u) => (statusFilter === "active" ? u.isActive : !u.isActive))
    : users;

  const handleCreateUser = async (formData: Partial<IUser>) => {
    try {
      await userService.createUser(formData);
      addModal.close();
      toast.success("User created successfully");
      refetch();
    } catch {
      toast.error("Failed to create user");
    }
  };

  const handleEditUser = async (formData: Partial<IUser>) => {
    if (!selectedUser) return;
    try {
      await userService.updateUser(selectedUser._id, formData);
      editModal.close();
      setSelectedUser(null);
      toast.success("User updated successfully");
      refetch();
    } catch {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await userService.deleteUser(userToDelete._id);
      deleteModal.close();
      setUserToDelete(null);
      toast.success("User deleted successfully");
      refetch();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await userService.exportUsers();
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Users exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export users");
    }
  };

  // ── Bulk upload handlers ──
  const resetBulkState = () => {
    setBulkFile(null);
    setBulkParsed([]);
    setBulkErrors([]);
    setBulkImporting(false);
    setSelectedOrgId(""); // Reset org selection
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = (format: "json" | "csv") => {
    // Organization is now selected via dropdown, so we remove it from the template
    if (format === "json") {
      const template = JSON.stringify([
        {
          name: "John Doe",
          email: "john.doe@example.com",
          role: "STUDENT",
          department: "Computer Science",
          passoutYear: 2024,
          gender: "Male",
        },
        {
          name: "Jane Smith",
          email: "jane.smith@example.com",
          role: "STUDENT",
          department: "Information Technology",
          passoutYear: 2025,
          gender: "Female",
        },
      ], null, 2);
      downloadFile(template, "users-template.json", "application/json");
    } else {
      const csv = `name,email,role,department,passoutYear,gender
"John Doe","john.doe@example.com","STUDENT","Computer Science",2024,"Male"
"Jane Smith","jane.smith@example.com","STUDENT","Information Technology",2025,"Female"`;
      downloadFile(csv, "users-template.csv", "text/csv");
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === "," && !inQuotes) { result.push(current); current = ""; }
      else { current += char; }
    }
    result.push(current);
    return result;
  };

  // Updated validation to inject selectedOrgId
  const validateAndSetUsers = (users: Partial<IUser>[]) => {
    const errors: string[] = [];
    const valid: Partial<IUser>[] = [];
    const validRoles = ["SUPER_ADMIN", "ADMIN", "STUDENT"];

    // Check if organization is selected (Required for Super Admin)
    if (!selectedOrgId) {
      errors.push("Please select an organization before validating.");
      setBulkErrors(errors);
      setBulkParsed([]);
      return;
    }

    users.forEach((u, i) => {
      const row = i + 1;
      if (!u.name?.trim()) { errors.push(`Row ${row}: Missing name`); return; }
      if (!u.email?.trim()) { errors.push(`Row ${row}: Missing email`); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)) { errors.push(`Row ${row}: Invalid email format`); return; }
      if (u.role && !validRoles.includes(u.role)) { errors.push(`Row ${row}: Invalid role "${u.role}"`); return; }

      valid.push({
        ...u,
        role: u.role || "STUDENT",
        organisation: selectedOrgId, // Inject selected organization
      });
    });

    setBulkParsed(valid);
    setBulkErrors(errors);
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setBulkErrors([]);
    setBulkParsed([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;

        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          const usersList = Array.isArray(parsed) ? parsed : parsed.users;
          if (!Array.isArray(usersList)) {
            setBulkErrors(["JSON must be an array of users or an object with a \"users\" array."]);
            return;
          }
          validateAndSetUsers(usersList);
        } else if (file.name.endsWith(".csv")) {
          const lines = text.split("\n").filter((l) => l.trim());
          if (lines.length < 2) {
            setBulkErrors(["CSV must have a header row and at least one data row."]);
            return;
          }
          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
          const usersList = lines.slice(1).map((line) => {
            const values = parseCSVLine(line);
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ""; });
            return {
              name: obj.name,
              email: obj.email,
              role: obj.role?.toUpperCase() || "STUDENT",
              department: obj.department || undefined,
              passoutYear: obj.passoutyear ? parseInt(obj.passoutyear) : undefined,
              gender: obj.gender || undefined,
            } as Partial<IUser>;
          });
          validateAndSetUsers(usersList);
        } else {
          setBulkErrors(["Unsupported file format. Please upload a .json or .csv file."]);
        }
      } catch {
        setBulkErrors(["Failed to parse file. Please check the format."]);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (bulkParsed.length === 0) return;
    setBulkImporting(true);
    try {
      const res = await userService.bulkImportUsers(bulkParsed); 
      const imported = res.data?.data?.imported ?? bulkParsed.length;
      bulkUploadModal.close();
      resetBulkState();
      toast.success(`${imported} user(s) imported successfully`);
      refetch();
    } catch (error) {
      toast.error("Failed to import users");
    } finally {
      setBulkImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <UserFilters
          search={search}
          onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
          roleFilter={isAdmin ? "STUDENT" : roleFilter}
          onRoleFilterChange={isAdmin ? () => {} : (val) => { setRoleFilter(val); setCurrentPage(1); }}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
          hideRoleFilter={isAdmin}
        />
        <div className="flex gap-2 shrink-0">
          {isSuperAdmin && (
            <>
              <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={handleExportUsers}>Export</Button>
              <Button 
                variant="outline" 
                size="sm" 
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => { resetBulkState(); bulkUploadModal.open(); }}
              >
                Import
              </Button>
            </>
          )}
          <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={addModal.open}>
            {isAdmin ? "Add Student" : "Add User"}
          </Button>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-card border border-surface-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState title="No users found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-surface-border">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Points</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Streak</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name || "Unnamed"}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={roleBadgeVariant[user.role]}>{user.role.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{user.department || "\u2014"}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm font-medium text-gray-900">{user.points}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{user.streak > 0 ? `${user.streak} days` : "\u2014"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.isActive ? "success" : "danger"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Dropdown
                        items={[
                          { label: "View Details", icon: <Eye className="h-4 w-4" />, onClick: () => { setSelectedUser(user); viewModal.open(); } },
                          { label: isAdmin ? "Edit Student" : "Edit User", icon: <Edit className="h-4 w-4" />, onClick: () => { setSelectedUser(user); editModal.open(); } },
                          { label: isAdmin ? "Delete Student" : "Delete User", icon: <Trash2 className="h-4 w-4" />, onClick: () => { setUserToDelete(user); deleteModal.open(); }, danger: true },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}&ndash;{Math.min(currentPage * PAGE_SIZE, totalUsers)} of {totalUsers} users
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal isOpen={addModal.isOpen} onClose={addModal.close} title={isAdmin ? "Add New Student" : roleFilter === "ADMIN" ? "Add New Admin" : "Add New User"} size="lg">
        <UserForm onSubmit={handleCreateUser} onCancel={addModal.close} forceStudentRole={isAdmin} defaultRole={roleFilter === "ADMIN" ? "ADMIN" : undefined} />
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Edit User" size="lg">
        <UserForm user={selectedUser} onSubmit={handleEditUser} onCancel={editModal.close} />
      </Modal>

      {/* View User Modal */}
      <Modal isOpen={viewModal.isOpen} onClose={() => { viewModal.close(); setSelectedUser(null); }} title="User Details">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={selectedUser.name} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Role", value: selectedUser.role.replace("_", " ") },
                { label: "Status", value: selectedUser.isActive ? "Active" : "Inactive" },
                { label: "Points", value: selectedUser.points },
                { label: "Streak", value: `${selectedUser.streak} days (max: ${selectedUser.maxStreak})` },
                { label: "Department", value: selectedUser.department || "Not set" },
                { label: "Passout Year", value: selectedUser.passoutYear || "Not set" },
                { label: "Gender", value: selectedUser.gender || "Not set" },
              ].map((item) => (
                <div key={item.label} className="bg-surface-secondary rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium mt-1">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-surface-secondary rounded-lg p-3">
              <p className="text-xs text-gray-500">Joined</p>
              <p className="text-sm font-medium mt-1">
                {new Date(selectedUser.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={bulkUploadModal.isOpen}
        onClose={() => { bulkUploadModal.close(); resetBulkState(); }}
        title="Bulk Import Users"
        size="lg"
      >
        <div className="space-y-6">
          {/* Organization Selection Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Organization <span className="text-red-500">*</span>
            </label>
            <Select
              options={[
                { value: "", label: "Choose an organization..." },
                ...organizations.map((org: any) => ({ value: org._id, label: org.name }))
              ]}
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                // Re-validate if file already exists
                if (bulkFile) {
                  // Trigger a re-parse/validation manually or just clear errors to prompt user to re-check
                  setBulkErrors([]); 
                  setBulkParsed([]);
                } 
              }}
              className="w-full"
            />
            {!selectedOrgId && bulkFile && (
              <p className="text-xs text-amber-600 mt-1">Please select an organization to proceed with validation.</p>
            )}
          </div>

          {/* Template download */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Download a template</p>
                <p className="text-xs text-blue-700 mt-1">
                  Download the template, fill in user details, and upload it below. 
                  The organization will be assigned based on your selection above.
                </p>
              </div>
            </div>
            <div className="flex gap-2 ml-8">
              <Button variant="outline" size="sm" onClick={() => downloadTemplate("json")}>JSON Template</Button>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")}>CSV Template</Button>
            </div>
          </div>

          {/* File upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Upload File</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">
                {bulkFile ? bulkFile.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Supports .json and .csv files</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleBulkFileChange}
              className="hidden"
            />
          </div>

          {/* Validation errors */}
          {bulkErrors.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">{bulkErrors.length} validation error(s)</span>
              </div>
              <ul className="ml-6 space-y-1 max-h-32 overflow-y-auto">
                {bulkErrors.map((err, i) => (
                  <li key={i} className="text-xs text-red-700">{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {bulkParsed.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">{bulkParsed.length} user(s) ready to import</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {bulkParsed.slice(0, 10).map((u, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-gray-400 shrink-0">{i + 1}.</span>
                      <span className="text-sm text-gray-900 truncate">{u.name}</span>
                      <span className="text-xs text-gray-500 truncate">({u.email})</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="info">
                        {organizations.find((o: any) => o._id === selectedOrgId)?.name || 'Selected Org'}
                      </Badge>
                      <Badge variant="gray">{u.role}</Badge>
                    </div>
                  </div>
                ))}
                {bulkParsed.length > 10 && (
                  <p className="text-xs text-gray-500 text-center">...and {bulkParsed.length - 10} more</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
            <Button variant="ghost" onClick={() => { bulkUploadModal.close(); resetBulkState(); }}>Cancel</Button>
            <Button
              onClick={handleBulkImport}
              disabled={bulkParsed.length === 0 || bulkImporting || !selectedOrgId}
              isLoading={bulkImporting}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Import {bulkParsed.length > 0 ? `${bulkParsed.length} Users` : "Users"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => { deleteModal.close(); setUserToDelete(null); }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete "${userToDelete?.name}"? This action will soft-delete the user and can be reversed.`}
      />
    </div>
  );
}