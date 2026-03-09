export interface IOrganisation {
  _id: string;
  name: string;
  address?: string;
  admin?: string;
  studentCount?: number;
  batchCount?: number;
  createdAt: string;
  updatedAt: string;
}
