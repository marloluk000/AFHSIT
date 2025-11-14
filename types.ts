export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ProductInfo {
  productName: string;
  description: string;
  searchQuery: string;
  suggestedCondition?: ItemCondition;
  imageBase64?: string;
}

export type ItemCondition = 'New' | 'Good' | 'Fair' | 'Poor';

export interface InventoryItem extends ProductInfo {
    id: string;
    quantity: number;
    condition: ItemCondition;
    location: string;
    notes?: string;
    reorderPoint?: number;
    dateAdded: string;
}

export interface Player {
    id: string;
    name: string;
    jerseyNumber?: number;
}

export interface PlayerInventoryAssignment {
    id:string;
    playerId: string;
    inventoryId: string;
    quantity: number;
    dateAssigned: string;
}