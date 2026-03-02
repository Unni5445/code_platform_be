import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { UserPlus, Edit, Trash2, Eye, Download, Upload } from "lucide-react";
import { userService } from "@/services";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks";
import { Button, Badge, Modal, ConfirmDialog, Pagination, Avatar, Dropdown, EmptyState, Spinner } from "@/components/ui";
import { UserFilters } from "@/components/users/UserFilters";
import { UserForm } from "@/components/users/UserForm";
import { useModal } from "@/hooks";
import type { IUser, UserRole } from "@/types";
import toast from "react-hot-toast";

const roleBadgeVariant: Record<UserRole, "primary" | "secondary" | "info"> = {
  SUPER_ADMIN: "primary",
  ADMIN: "secondary",
  STUDENT: "info",
};

const PAGE_SIZE = 8;

export default function UsersPage() {
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

  const debouncedSearch = useDebounce(search, 300);

  const fetchUsers = useCallback(
    () =>
      userService.getUsers({
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
      }),
    [currentPage, debouncedSearch, roleFilter]
  );

  const { data, loading, refetch } = useApi(fetchUsers, [currentPage, debouncedSearch, roleFilter]);

  const users = data?.users ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalUsers = data?.totalUsers ?? 0;

  // Client-side status filter (backend doesn't have status param)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <UserFilters
          search={search}
          onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
          roleFilter={roleFilter}
          onRoleFilterChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
        />
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>Export</Button>
          <Button variant="outline" size="sm" leftIcon={<Upload className="h-4 w-4" />}>Import</Button>
          <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={addModal.open}>Add User</Button>
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
                          { label: "Edit User", icon: <Edit className="h-4 w-4" />, onClick: () => { setSelectedUser(user); editModal.open(); } },
                          { label: "Delete User", icon: <Trash2 className="h-4 w-4" />, onClick: () => { setUserToDelete(user); deleteModal.open(); }, danger: true },
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

      <Modal isOpen={addModal.isOpen} onClose={addModal.close} title="Add New User" size="lg">
        <UserForm onSubmit={handleCreateUser} onCancel={addModal.close} />
      </Modal>

      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Edit User" size="lg">
        <UserForm user={selectedUser} onSubmit={handleEditUser} onCancel={editModal.close} />
      </Modal>

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
