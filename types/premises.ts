export interface PremisePersonType {
  id: string;
  name: string;
  description?: string | null;
  sequenceNumber: number;
  premiseId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Premise {
  id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  sequenceNumber?: number;
  personTypes?: PremisePersonType[];
  createdAt?: Date;
  updatedAt?: Date;
}
