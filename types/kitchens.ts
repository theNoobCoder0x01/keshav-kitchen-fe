export interface Kitchen {
  id: string;
  name: string;
  description?: string | null;
  defaultCook?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
