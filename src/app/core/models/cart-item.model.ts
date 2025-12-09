export interface CartItem {
  productId: number;
  quantity: number;
  product?: {
    name: string;
    price: number;
    imageUrl: string;
  };
  // Pour Dexie
  id?: number;
  updatedAt?: Date;
}

export interface OptimizedCartItem {
  id: number;
  qty: number;
}

export interface PendingSyncAction {
  id?: number;
  type: 'ADD_TO_CART' | 'UPDATE_CART' | 'CLEAR_CART';
  payload: any;
  timestamp: Date;
  retryCount: number;
  lastAttempt?: Date;
}
