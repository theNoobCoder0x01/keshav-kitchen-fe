export interface KitchenPersonType {
  id: string;
  name: string;
  description?: string | null;
  sequenceNumber: number;
  kitchenId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Kitchen {
  id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  sequenceNumber?: number;
  personTypes?: KitchenPersonType[];
  createdAt?: Date;
  updatedAt?: Date;
}
