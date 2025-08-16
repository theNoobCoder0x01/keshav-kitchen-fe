export interface Kitchen {
  id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}