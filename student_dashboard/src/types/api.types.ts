export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  success: boolean;
  message: string;
}
