import { useState } from "react";
import { Send, Plus, Edit, Trash2, Bell, Building2, Users, Settings, Activity } from "lucide-react";
import { Button, Card, Input, Select, Badge, Tabs, Modal, ConfirmDialog, EmptyState, Spinner } from "@/components/ui";
import { batchService, organisationService } from "@/services";
import { useApi } from "@/hooks/useApi";
import { useModal } from "@/hooks";
import type { IBatch, IOrganisation } from "@/types";
import toast from "react-hot-toast";

const systemTabs = [
  { id: "notifications", label: "Notifications" },
  { id: "batches", label: "Batches" },
  { id: "organisations", label: "Organisations" },
  { id: "settings", label: "Settings" },
  { id: "logs", label: "System Logs" },
];

const mockLogs = [
  { id: 1, level: "info", message: "User login: superadmin@platform.com", timestamp: "2026-02-28 03:45:12" },
  { id: 2, level: "info", message: "New user created: karthik.s@example.com", timestamp: "2026-02-28 03:30:05" },
  { id: 3, level: "warning", message: "Failed login attempt: unknown@test.com (3 attempts)", timestamp: "2026-02-28 03:15:22" },
  { id: 4, level: "info", message: "Course published: System Design Basics", timestamp: "2026-02-28 02:50:18" },
  { id: 5, level: "error", message: "Email delivery failed: smtp timeout for user usr_012", timestamp: "2026-02-28 02:30:44" },
  { id: 6, level: "info", message: "Certificate generated: cert_006 for Nisha Agarwal", timestamp: "2026-02-28 02:10:33" },
  { id: 7, level: "info", message: "Test submitted: DSA Weekly Challenge #5 by Rahul Sharma", timestamp: "2026-02-28 01:55:19" },
  { id: 8, level: "warning", message: "Rate limit reached: IP 192.168.1.105 (100 req/min)", timestamp: "2026-02-28 01:30:07" },
  { id: 9, level: "info", message: "Batch created: Batch 2026-B", timestamp: "2026-02-28 01:00:55" },
  { id: 10, level: "error", message: "Database query timeout: leaderboard aggregation (>5s)", timestamp: "2026-02-27 23:45:30" },
];

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState("notifications");

  // Notification state
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifTarget, setNotifTarget] = useState("all");

  // Batch state
  const addBatchModal = useModal();
  const deleteBatchModal = useModal();
  const updateBatchModal = useModal();
  const editBatchModal = useModal();
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<IBatch | null>(null);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [newBatchName, setNewBatchName] = useState("");
  const [batchOrganisationId, setBatchOrganisationId] = useState<string>("");

  // Organisation state
  const addOrganisationModal = useModal();
  const editOrganisationModal = useModal();
  const deleteOrganisationModal = useModal();
  const [organisationToDelete, setOrganisationToDelete] = useState<string | null>(null);
  const [editingOrganisation, setEditingOrganisation] = useState<IOrganisation | null>(null);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgAddress, setNewOrgAddress] = useState("");

  // API data
  const { data: batches, loading: batchesLoading, refetch: refetchBatches } = useApi(
    () => batchService.getBatches(),
    []
  );

  const { data: organisations, loading: orgsLoading, refetch: refetchOrganisations } = useApi(
    () => organisationService.getOrganisations(),
    []
  );

  const handleSendNotification = () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Notification sent successfully");
    setNotifTitle("");
    setNotifMessage("");
  };

  const handleCreateBatch = async () => {
    if (!newBatchName.trim() || !batchOrganisationId.trim()) return;
    try {
      await batchService.createBatch({ name: newBatchName, organisation: batchOrganisationId });
      addBatchModal.close();
      setNewBatchName("");
      setBatchOrganisationId("");
      toast.success("Batch created successfully");
      refetchBatches();
    } catch {
      toast.error("Failed to create batch");
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    try {
      await batchService.deleteBatch(batchToDelete);
      deleteBatchModal.close();
      setBatchToDelete(null);
      toast.success("Batch deleted successfully");
      refetchBatches();
    } catch {
      toast.error("Failed to delete batch");
    }
  };

  const handleEditBatch = async () => {
    if (!editingBatch || !newBatchName.trim()) return;
    try {
      await batchService.updateBatch(editingBatch._id, {
        name: newBatchName,
        organisation: batchOrganisationId || undefined,
      });
      editBatchModal.close();
      setEditingBatch(null);
      setNewBatchName("");
      setBatchOrganisationId("");
      toast.success("Batch updated successfully");
      refetchBatches();
    } catch {
      toast.error("Failed to update batch");
    }
  };

  const openEditBatchModal = (batch: IBatch) => {
    setEditingBatch(batch);
    setNewBatchName(batch.name);
    const orgId = typeof batch.organisation === "object" && batch.organisation !== null
      ? (batch.organisation as unknown as { _id: string })._id
      : (batch.organisation as string) || "";
    setBatchOrganisationId(orgId);
    editBatchModal.open();
  };

  const handleDeleteBatches = async () => {
    if (selectedBatches.length === 0) return;
    try {
      await organisationService.deleteBatches(selectedBatches);
      setSelectedBatches([]);
      toast.success(`${selectedBatches.length} batch(es) deleted successfully`);
      refetchBatches();
    } catch {
      toast.error("Failed to delete batches");
    }
  };

  const handleUpdateBatches = async () => {
    if (selectedBatches.length === 0) return;
    try {
      await batchService.updateBatches(selectedBatches, batchOrganisationId || undefined);
      setSelectedBatches([]);
      setBatchOrganisationId("");
      toast.success(`${selectedBatches.length} batch(es) updated successfully`);
      refetchBatches();
    } catch {
      toast.error("Failed to update batches");
    }
  };

  const handleSelectBatch = (batchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBatches([...selectedBatches, batchId]);
    } else {
      setSelectedBatches(selectedBatches.filter(id => id !== batchId));
    }
  };

  const handleSelectAllBatches = (checked: boolean) => {
    if (checked) {
      setSelectedBatches(batchList.map(batch => batch._id));
    } else {
      setSelectedBatches([]);
    }
  };

  const handleCreateOrganisation = async () => {
    if (!newOrgName.trim()) return;
    try {
      await organisationService.createOrganisation({
        name: newOrgName,
        address: newOrgAddress || undefined,
      });
      addOrganisationModal.close();
      setNewOrgName("");
      setNewOrgAddress("");
      toast.success("Organisation created successfully");
      refetchOrganisations();
    } catch {
      toast.error("Failed to create organisation");
    }
  };

  const handleEditOrganisation = async () => {
    if (!editingOrganisation || !newOrgName.trim()) return;
    try {
      await organisationService.updateOrganisation(editingOrganisation._id, {
        name: newOrgName,
        address: newOrgAddress || undefined,
      });
      editOrganisationModal.close();
      setEditingOrganisation(null);
      setNewOrgName("");
      setNewOrgAddress("");
      toast.success("Organisation updated successfully");
      refetchOrganisations();
    } catch {
      toast.error("Failed to update organisation");
    }
  };

  const handleDeleteOrganisation = async () => {
    if (!organisationToDelete) return;
    try {
      await organisationService.deleteOrganisation(organisationToDelete);
      deleteOrganisationModal.close();
      setOrganisationToDelete(null);
      toast.success("Organisation deleted successfully");
      refetchOrganisations();
    } catch {
      toast.error("Failed to delete organisation");
    }
  };

  const openEditModal = (org: IOrganisation) => {
    setEditingOrganisation(org);
    setNewOrgName(org.name);
    setNewOrgAddress(org.address || "");
    editOrganisationModal.open();
  };

  const logLevelStyle = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
  };

  const batchList = batches || [];
  const orgList = organisations || [];

  return (
    <div className="space-y-6">
      <Tabs tabs={systemTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card header={<h3 className="text-base font-semibold text-gray-900">Send Notification</h3>}>
              <div className="space-y-4">
                <Input label="Title" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="Notification title..." />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors"
                    placeholder="Write your notification message..."
                  />
                </div>
                <Select
                  label="Target Audience"
                  options={[
                    { value: "all", label: "All Users" },
                    { value: "students", label: "Students Only" },
                    { value: "admins", label: "Admins Only" },
                  ]}
                  value={notifTarget}
                  onChange={(e) => setNotifTarget(e.target.value)}
                />
                <Button leftIcon={<Send className="h-4 w-4" />} onClick={handleSendNotification}>Send Notification</Button>
              </div>
            </Card>
          </div>
          <div>
            <Card header={<h3 className="text-base font-semibold text-gray-900">Recent Notifications</h3>}>
              <div className="space-y-3">
                {[
                  { title: "System Maintenance", time: "2 hours ago", target: "All Users" },
                  { title: "New Course Available", time: "1 day ago", target: "Students" },
                  { title: "Test Results Published", time: "2 days ago", target: "Students" },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg">
                    <div className="p-1.5 bg-primary-100 rounded-lg">
                      <Bell className="h-3.5 w-3.5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500">{n.time} &middot; {n.target}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Batches Tab */}
      {activeTab === "batches" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={addBatchModal.open}>Add Batch</Button>
              {selectedBatches.length > 0 && (
                <>
                  <Button variant="outline" onClick={updateBatchModal.open}>Assign to Organisation</Button>
                  <Button variant="outline" color="red" onClick={() => { setSelectedBatches([]); deleteBatchModal.open(); }}>Delete Selected</Button>
                </>
              )}
            </div>
            {batchList.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectedBatches.length === batchList.length && batchList.length > 0}
                  onChange={(e) => handleSelectAllBatches(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="selectAll" className="text-sm text-gray-600">
                  Select All ({selectedBatches.length}/{batchList.length})
                </label>
              </div>
            )}
          </div>
          <div className="bg-surface rounded-xl shadow-card border border-surface-border overflow-hidden">
            {batchesLoading ? (
              <div className="flex items-center justify-center h-40">
                <Spinner />
              </div>
            ) : batchList.length === 0 ? (
              <EmptyState title="No batches found" description="Create your first batch to get started." />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-secondary border-b border-surface-border">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        id="headerSelectAll"
                        checked={selectedBatches.length === batchList.length && batchList.length > 0}
                        onChange={(e) => handleSelectAllBatches(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch Name</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Created</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {batchList.map((batch: IBatch) => (
                    <tr key={batch._id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedBatches.includes(batch._id)}
                          onChange={(e) => handleSelectBatch(batch._id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-100 rounded-lg"><Users className="h-4 w-4 text-primary-600" /></div>
                          <span className="text-sm font-medium text-gray-900">{batch.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {typeof batch.organisation === "object" && batch.organisation !== null
                            ? (batch.organisation as unknown as { name: string }).name
                            : batch.organisation || "\u2014"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="info">{batch.students?.length ?? 0} students</Badge>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-500">{new Date(batch.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEditBatchModal(batch)} className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => { setBatchToDelete(batch._id); deleteBatchModal.open(); }} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Modal isOpen={addBatchModal.isOpen} onClose={addBatchModal.close} title="Add New Batch" size="sm"
            footer={<><Button variant="ghost" onClick={addBatchModal.close}>Cancel</Button><Button onClick={handleCreateBatch} disabled={!newBatchName.trim() || !batchOrganisationId.trim()}>Create Batch</Button></>}>
            <div className="space-y-4">
              <Input label="Batch Name" value={newBatchName} onChange={(e) => setNewBatchName(e.target.value)} placeholder="e.g., Batch 2026-C" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organisation *</label>
                <Select
                  value={batchOrganisationId}
                  onChange={(e) => setBatchOrganisationId(e.target.value)}
                  options={[
                    { value: "", label: "Select an organisation..." },
                    ...orgList.map((org: IOrganisation) => ({ value: org._id, label: org.name }))
                  ]}
                  placeholder="Select an organisation..."
                />
              </div>
            </div>
          </Modal>
          <ConfirmDialog isOpen={deleteBatchModal.isOpen} onClose={() => { deleteBatchModal.close(); setBatchToDelete(null); }} onConfirm={handleDeleteBatch} title="Delete Batch" message="Are you sure you want to delete this batch?" />
          <Modal isOpen={editBatchModal.isOpen} onClose={() => { editBatchModal.close(); setEditingBatch(null); }} title="Edit Batch" size="sm"
            footer={<><Button variant="ghost" onClick={() => { editBatchModal.close(); setEditingBatch(null); }}>Cancel</Button><Button onClick={handleEditBatch} disabled={!newBatchName.trim()}>Update Batch</Button></>}>
            <div className="space-y-4">
              <Input label="Batch Name" value={newBatchName} onChange={(e) => setNewBatchName(e.target.value)} placeholder="e.g., Batch 2026-C" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
                <Select
                  value={batchOrganisationId}
                  onChange={(e) => setBatchOrganisationId(e.target.value)}
                  options={[
                    { value: "", label: "No Organisation" },
                    ...orgList.map((org: IOrganisation) => ({ value: org._id, label: org.name }))
                  ]}
                  placeholder="Select an organisation..."
                />
              </div>
            </div>
          </Modal>
          <Modal isOpen={updateBatchModal.isOpen} onClose={updateBatchModal.close} title="Assign Batches to Organisation" size="sm"
            footer={<><Button variant="ghost" onClick={updateBatchModal.close}>Cancel</Button><Button onClick={handleUpdateBatches} disabled={!batchOrganisationId.trim()}>Assign Batches</Button></>}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Organisation</label>
                <Select
                  value={batchOrganisationId}
                  onChange={(e) => setBatchOrganisationId(e.target.value)}
                  options={[
                    { value: "", label: "No Organisation" },
                    ...orgList.map((org: IOrganisation) => ({ value: org._id, label: org.name }))
                  ]}
                  placeholder="Select an organisation..."
                />
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>{selectedBatches.length}</strong> batch(es) will be assigned to <strong>{batchOrganisationId ? orgList.find((org: IOrganisation) => org._id === batchOrganisationId)?.name : "no organisation"}</strong>
                </p>
              </div>
            </div>
          </Modal>
        </>
      )}

      {/* Organisations Tab */}
      {activeTab === "organisations" && (
        <>
          <div className="flex justify-end mb-6">
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={addOrganisationModal.open}>Add Organisation</Button>
          </div>
          {orgsLoading ? (
            <div className="flex items-center justify-center h-40">
              <Spinner />
            </div>
          ) : orgList.length === 0 ? (
            <EmptyState title="No organisations found" description="No organisations have been created yet." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {orgList.map((org: IOrganisation) => (
                <Card key={org._id} className="hover:shadow-card-hover transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary-100 rounded-xl"><Building2 className="h-5 w-5 text-primary-600" /></div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{org.name}</h3>
                        <p className="text-sm text-gray-500">{org.address || "\u2014"}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(org)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setOrganisationToDelete(org._id); deleteOrganisationModal.open(); }}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-surface-secondary rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">{org.courses?.length ?? 0}</p>
                      <p className="text-xs text-gray-500">Courses</p>
                    </div>
                    <div className="bg-surface-secondary rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">{org.students?.length ?? 0}</p>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>
                    <div className="bg-surface-secondary rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {typeof org.admin === "object" && org.admin !== null
                          ? (org.admin as unknown as { name: string }).name
                          : "\u2014"}
                      </p>
                      <p className="text-xs text-gray-500">Admin</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <Modal
            isOpen={addOrganisationModal.isOpen}
            onClose={addOrganisationModal.close}
            title="Add New Organisation"
            size="sm"
            footer={<><Button variant="ghost" onClick={addOrganisationModal.close}>Cancel</Button><Button onClick={handleCreateOrganisation} disabled={!newOrgName.trim()}>Create Organisation</Button></>}
          >
            <div className="space-y-4">
              <Input
                label="Organisation Name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="e.g., Tech Institute"
              />
              <Input
                label="Address"
                value={newOrgAddress}
                onChange={(e) => setNewOrgAddress(e.target.value)}
                placeholder="e.g., 123 Main Street, New Delhi"
              />
            </div>
          </Modal>
          <Modal
            isOpen={editOrganisationModal.isOpen}
            onClose={editOrganisationModal.close}
            title="Edit Organisation"
            size="sm"
            footer={<><Button variant="ghost" onClick={editOrganisationModal.close}>Cancel</Button><Button onClick={handleEditOrganisation} disabled={!newOrgName.trim()}>Update Organisation</Button></>}
          >
            <div className="space-y-4">
              <Input
                label="Organisation Name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="e.g., Tech Institute"
              />
              <Input
                label="Address"
                value={newOrgAddress}
                onChange={(e) => setNewOrgAddress(e.target.value)}
                placeholder="e.g., 123 Main Street, New Delhi"
              />
            </div>
          </Modal>
          <ConfirmDialog
            isOpen={deleteOrganisationModal.isOpen}
            onClose={() => { deleteOrganisationModal.close(); setOrganisationToDelete(null); }}
            onConfirm={handleDeleteOrganisation}
            title="Delete Organisation"
            message="Are you sure you want to delete this organisation? This action cannot be undone."
          />
        </>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <Card header={<h3 className="text-base font-semibold text-gray-900">Platform Settings</h3>}>
          <div className="space-y-6 max-w-xl">
            <Input label="Platform Name" defaultValue="CodePlatform" />
            <Input label="Support Email" type="email" defaultValue="support@platform.com" />
            <Select
              label="Default Language"
              options={[
                { value: "en", label: "English" },
                { value: "hi", label: "Hindi" },
              ]}
              defaultValue="en"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Allowed Programming Languages</label>
              <div className="flex flex-wrap gap-2">
                {["JavaScript", "Python", "Java", "C++", "C#", "Ruby"].map((lang) => (
                  <span key={lang} className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">{lang}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Points per Completion" type="number" defaultValue="10" />
              <Input label="Max Streak Bonus" type="number" defaultValue="50" />
            </div>
            <Button leftIcon={<Settings className="h-4 w-4" />}>Save Settings</Button>
          </div>
        </Card>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <Card header={
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">System Logs</h3>
            <Badge variant="gray">{mockLogs.length} entries</Badge>
          </div>
        } noPadding>
          <div className="divide-y divide-surface-border max-h-[600px] overflow-y-auto">
            {mockLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${logLevelStyle[log.level as keyof typeof logLevelStyle]}`}>
                    {log.level}
                  </span>
                  <span className="text-xs text-gray-400 font-mono whitespace-nowrap">{log.timestamp}</span>
                </div>
                <p className="text-sm text-gray-700">{log.message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
