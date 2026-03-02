export interface ICertificate {
  _id: string;
  student: string;
  course?: string;
  test?: string;
  title: string;
  issuedAt: string;
  certificateUrl?: string;
  qrCodeUrl?: string;
  verificationLink?: string;
  grade?: string;
  score?: number;
  createdAt: string;
  updatedAt: string;
}
