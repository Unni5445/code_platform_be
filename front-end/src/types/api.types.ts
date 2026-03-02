export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  success: boolean;
  message: string;
}

export interface PaginatedResponse<T> {
  users: T[];
  currentPage: number;
  totalPages: number;
  totalUsers: number;
}
