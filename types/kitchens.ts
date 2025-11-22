export interface Kitchen {
  id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  sequenceNumber?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
