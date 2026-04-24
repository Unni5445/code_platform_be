import { useState } from "react";
import { Modal, Button, Input, Select } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services";
import toast from "react-hot-toast";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateUserLocally } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    gender: user?.gender || "",
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
    department: user?.department || "",
    passoutYear: user?.passoutYear || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      // Only allow digits and limit to 10
      const digitsOnly = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    setLoading(true);
    try {
      const res = await userService.updateUser(user._id, {
        ...formData,
        gender: formData.gender ? (formData.gender as "Male" | "Female" | "Other") : undefined,
        passoutYear: formData.passoutYear ? Number(formData.passoutYear) : undefined,
      });
      
      if (res.data.success) {
        updateUserLocally(res.data.data);
        toast.success("Profile updated successfully!");
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Personal Information"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading} className="font-bold">
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={loading} className="font-bold px-8">
            Save Changes
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your full name"
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter 10-digit number"
            maxLength={10}
          />
          <Select
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            placeholder="Choose Gender"
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Date of Birth"
            name="dob"
            type="date"
            value={formData.dob}
            onChange={handleChange}
          />
          <Input
            label="Passout Year"
            name="passoutYear"
            type="number"
            value={formData.passoutYear}
            onChange={handleChange}
            placeholder="e.g. 2024"
          />
        </div>
        <Input
          label="Department / Course"
          name="department"
          value={formData.department}
          onChange={handleChange}
          placeholder="e.g. Computer Science"
        />
      </form>
    </Modal>
  );
}
