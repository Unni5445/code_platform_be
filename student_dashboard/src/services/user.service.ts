import type { ApiResponse } from "@/types";
import api from "./api";

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  department?: string;
  gender?: "Male" | "Female" | "Other";
  dob?: string | Date;
  passoutYear?: number;
}

export const userService = {
  updateUser: (id: string, data: UpdateProfileData) => {
    return api.put<ApiResponse<any>>(`/users/${id}`, data);
  },
};

export default userService;
