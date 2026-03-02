import { useState, type FormEvent } from "react";
import { Button, Input, Select } from "@/components/ui";
import { organisationService, batchService } from "@/services";
import { useApi } from "@/hooks/useApi";
import type { IUser } from "@/types";
import type { IOrganisation, IBatch } from "@/types";

interface UserFormProps {
  user?: IUser | null;
  onSubmit: (data: Partial<IUser> & { password?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function resolveId(field: string | { _id: string } | undefined): string {
  if (!field) return "";
  if (typeof field === "object") return field._id;
  return field;
}

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [role, setRole] = useState(user?.role || "STUDENT");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState(user?.department || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [passoutYear, setPassoutYear] = useState(user?.passoutYear?.toString() || "");
  const [dob, setDob] = useState(user?.dob ? user.dob.slice(0, 10) : "");
  const [organisationId, setOrganisationId] = useState(resolveId(user?.organisation));
  const [batchId, setBatchId] = useState(resolveId(user?.batch));

  const { data: organisations } = useApi(() => organisationService.getOrganisations(), []);
  const { data: batches } = useApi(
    () => batchService.getBatches(organisationId ? { organisation: organisationId } : undefined),
    [organisationId]
  );

  const orgList = organisations || [];
  const batchList = batches || [];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data: Partial<IUser> & { password?: string } = {
      name,
      email,
      phone: phone || undefined,
      role: role as IUser["role"],
      department: department || undefined,
      gender: (gender || undefined) as IUser["gender"],
      passoutYear: passoutYear ? Number(passoutYear) : undefined,
      dob: dob || undefined,
      organisation: organisationId || undefined,
      batch: batchId || undefined,
    };
    if (password) data.password = password;
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter full name" />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter email address" />
      <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" />
      {!user && (
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter password" />
      )}
      <Select
        label="Role"
        options={[
          { value: "STUDENT", label: "Student" },
          { value: "ADMIN", label: "Admin" },
          { value: "SUPER_ADMIN", label: "Super Admin" },
        ]}
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />
      <Select
        label="Organisation"
        options={[
          { value: "", label: "Select Organisation" },
          ...orgList.map((org: IOrganisation) => ({ value: org._id, label: org.name })),
        ]}
        value={organisationId}
        onChange={(e) => { setOrganisationId(e.target.value); setBatchId(""); }}
      />
      <Select
        label="Batch"
        options={[
          { value: "", label: organisationId ? "Select Batch" : "Select organisation first" },
          ...batchList.map((batch: IBatch) => ({ value: batch._id, label: batch.name })),
        ]}
        value={batchId}
        onChange={(e) => setBatchId(e.target.value)}
      />
      <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Computer Science" />
      <Input label="Passout Year" type="number" value={passoutYear} onChange={(e) => setPassoutYear(e.target.value)} placeholder="e.g., 2026" />
      <Input label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
      <Select
        label="Gender"
        options={[
          { value: "", label: "Select Gender" },
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
          { value: "Other", label: "Other" },
        ]}
        value={gender}
        onChange={(e) => setGender(e.target.value)}
      />
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>{user ? "Update User" : "Create User"}</Button>
      </div>
    </form>
  );
}
