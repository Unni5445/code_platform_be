import { useState, useCallback, useRef } from "react";
import { UserPlus, Edit, Trash2, Eye, Download, Upload, FileUp, AlertCircle, CheckCircle2, Key } from "lucide-react";
import { organisationService, userService } from "@/services";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks";
import { Button, Badge, Modal, ConfirmDialog, Pagination, Avatar, Dropdown, EmptyState, Spinner, Select, Switch } from "@/components/ui";
import { UserFilters } from "@/components/users/UserFilters";
import { UserForm } from "@/components/users/UserForm";
import { useModal } from "@/hooks";
import type { IUser } from "@/types";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const PAGE_SIZE = 8;

export default function AdminsPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<IUser | null>(null);
  const [userToReset, setUserToReset] = useState<IUser | null>(null);

  const addModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  const resetModal = useModal();
  const viewModal = useModal();
  const bulkUploadModal = useModal();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkParsed, setBulkParsed] = useState<Partial<IUser>[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  const debouncedSearch = useDebounce(search, 300);

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
        role: "ADMIN",
        status: statusFilter || undefined,
      }),
    [currentPage, debouncedSearch, statusFilter]
  );

  const { data, loading, refetch } = useApi(fetchUsers, [currentPage, debouncedSearch]);

  const users = data?.users ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalUsers = data?.totalUsers ?? 0;

  const filteredUsers = users;

  const handleCreateUser = async (formData: Partial<IUser>) => {
    try {
      await userService.createUser({ ...formData, role: "ADMIN" });
      addModal.close();
      toast.success("Admin created successfully");
      refetch();
    } catch {
      toast.error("Failed to create admin");
    }
  };

  const handleEditUser = async (formData: Partial<IUser>) => {
    if (!selectedUser) return;
    try {
      await userService.updateUser(selectedUser._id, formData);
      editModal.close();
      setSelectedUser(null);
      toast.success("Admin updated successfully");
      refetch();
    } catch {
      toast.error("Failed to update admin");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await userService.deleteUser(userToDelete._id);
      deleteModal.close();
      setUserToDelete(null);
      toast.success("Admin deleted successfully");
      refetch();
    } catch {
      toast.error("Failed to delete admin");
    }
  };

  const handleToggleStatus = async (user: IUser) => {
    try {
      await userService.updateUser(user._id, { isActive: !user.isActive });
      toast.success(`Admin ${user.isActive ? "deactivated" : "activated"} successfully`);
      refetch();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleResetPassword = async () => {
    if (!userToReset) return;
    try {
      await userService.adminResetPassword(userToReset._id);
      resetModal.close();
      setUserToReset(null);
      toast.success("Password reset successfully. Email sent to the admin.");
    } catch {
      toast.error("Failed to reset password");
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await userService.exportUsers({
        search: debouncedSearch || undefined,
        role: "ADMIN",
        status: statusFilter || undefined,
      });
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admins-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Admins exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export admins");
    }
  };

  const resetBulkState = () => {
    setBulkFile(null);
    setBulkParsed([]);
    setBulkErrors([]);
    setBulkImporting(false);
    setSelectedOrgId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = (format: "json" | "csv") => {
    if (format === "json") {
      const template = JSON.stringify([
        {
          name: "Admin User",
          email: "admin@example.com",
          role: "ADMIN",
        },
      ], null, 2);
      downloadFile(template, "admins-template.json", "application/json");
    } else {
      const csv = `name,email,role
"Admin User","admin@example.com","ADMIN"`;
      downloadFile(csv, "admins-template.csv", "text/csv");
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

  const validateAndSetUsers = (users: Partial<IUser>[]) => {
    const errors: string[] = [];
    const valid: Partial<IUser>[] = [];

    if (isSuperAdmin && !selectedOrgId) {
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

      valid.push({
        ...u,
        role: "ADMIN",
        organisation: isAdmin ? currentUser?.organisation : selectedOrgId,
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
          validateAndSetUsers(usersList);
        } else if (file.name.endsWith(".csv")) {
          const lines = text.split("\n").filter((l) => l.trim());
          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
          const usersList = lines.slice(1).map((line) => {
            const values = parseCSVLine(line);
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ""; });
            return {
              name: obj.name,
              email: obj.email,
              role: "ADMIN",
            } as Partial<IUser>;
          });
          validateAndSetUsers(usersList);
        }
      } catch {
        setBulkErrors(["Failed to parse file."]);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (bulkParsed.length === 0) return;
    setBulkImporting(true);
    try {
      await userService.bulkImportUsers(bulkParsed);
      bulkUploadModal.close();
      resetBulkState();
      toast.success(`Admins imported successfully`);
      refetch();
    } catch {
      toast.error("Failed to import admins");
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
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
        />
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={handleExportUsers}>Export</Button>
          {/* {isSuperAdmin && (
            <Button variant="outline" size="sm" leftIcon={<Upload className="h-4 w-4" />} onClick={() => { resetBulkState(); bulkUploadModal.open(); }}>Import</Button>
          )} */}
          <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={addModal.open}>Add Admin</Button>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-card border border-surface-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState title="No admins found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-surface-border">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">S.No</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Organization</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredUsers.map((user, index) => (
                  <tr key={user._id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-500">{(currentPage - 1) * PAGE_SIZE + index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name || "Unnamed"}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">
                        {typeof user.organisation === "object" ? user.organisation.name : user.organisation || "\u2014"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={user.isActive} 
                          onChange={() => handleToggleStatus(user)} 
                        />
                        <Badge variant={user.isActive ? "success" : "danger"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Dropdown
                        items={[
                          { label: "View Details", icon: <Eye className="h-4 w-4" />, onClick: () => { setSelectedUser(user); viewModal.open(); } },
                          { label: "Edit Admin", icon: <Edit className="h-4 w-4" />, onClick: () => { setSelectedUser(user); editModal.open(); } },
                          ...(isSuperAdmin ? [{ label: "Reset Password", icon: <Key className="h-4 w-4" />, onClick: () => { setUserToReset(user); resetModal.open(); } }] : []),
                          { label: "Delete Admin", icon: <Trash2 className="h-4 w-4" />, onClick: () => { setUserToDelete(user); deleteModal.open(); }, danger: true },
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
              Showing {(currentPage - 1) * PAGE_SIZE + 1}&ndash;{Math.min(currentPage * PAGE_SIZE, totalUsers)} of {totalUsers} admins
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      <Modal isOpen={addModal.isOpen} onClose={addModal.close} title="Add New Admin" size="lg">
        <UserForm onSubmit={handleCreateUser} onCancel={addModal.close} defaultRole="ADMIN" />
      </Modal>

      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Edit Admin" size="lg">
        <UserForm user={selectedUser} onSubmit={handleEditUser} onCancel={editModal.close} />
      </Modal>

      <Modal isOpen={viewModal.isOpen} onClose={() => { viewModal.close(); setSelectedUser(null); }} title="Admin Details">
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
                { label: "Status", value: selectedUser.isActive ? "Active" : "Inactive" },
                { label: "Organization", value: (typeof selectedUser.organisation === "object" ? selectedUser.organisation.name : selectedUser.organisation) || "Not set" },
              ].map((item) => (
                <div key={item.label} className="bg-surface-secondary rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={bulkUploadModal.isOpen} onClose={() => { bulkUploadModal.close(); resetBulkState(); }} title="Bulk Import Admins" size="lg">
        <div className="space-y-6">
          {isSuperAdmin && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Select Organization <span className="text-red-500">*</span></label>
              <Select
                options={[{ value: "", label: "Choose an organization..." }, ...organizations.map((org: any) => ({ value: org._id, label: org.name }))]}
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
            <Download className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Download Template</p>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => downloadTemplate("json")}>JSON</Button>
                <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")}>CSV</Button>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium">{bulkFile ? bulkFile.name : "Click to upload admins"}</p>
            <input ref={fileInputRef} type="file" accept=".json,.csv" onChange={handleBulkFileChange} className="hidden" />
          </div>

          {bulkErrors.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm font-medium text-red-800 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Errors:</p>
              <ul className="mt-2 text-xs text-red-700 list-disc ml-5">{bulkErrors.map((err, i) => <li key={i}>{err}</li>)}</ul>
            </div>
          )}

          {bulkParsed.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-green-800 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {bulkParsed.length} Admins ready</span>
              <Button onClick={handleBulkImport} isLoading={bulkImporting} size="sm">Import Now</Button>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => { deleteModal.close(); setUserToDelete(null); }}
        onConfirm={handleDeleteUser}
        title="Delete Admin"
        message={`Are you sure you want to delete "${userToDelete?.name}"?`}
      />

      <ConfirmDialog
        isOpen={resetModal.isOpen}
        onClose={() => { resetModal.close(); setUserToReset(null); }}
        onConfirm={handleResetPassword}
        title="Reset Password"
        message={`Are you sure you want to reset the password for "${userToReset?.name}"? A temporary password will be sent to their email.`}
        confirmLabel="Reset Password"
      />
    </div>
  );
}
