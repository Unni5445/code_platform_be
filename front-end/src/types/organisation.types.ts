export interface IOrganisation {
  _id: string;
  name: string;
  address?: string;
  admin?: string;
  students?: string[];
  courses?: string[];
  createdAt: string;
  updatedAt: string;
}
