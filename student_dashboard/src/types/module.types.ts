export interface IModule {
  _id: string;
  title: string;
  description?: string;
  course: string;
  test?: string;
  order: number;
  isActive: boolean;
  submoduleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ISubmodule {
  _id: string;
  title: string;
  description?: string;
  module: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
