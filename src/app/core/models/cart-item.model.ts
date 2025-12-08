export interface CartItem {
  productId: number;
  quantity: number;
  product?: {
    name: string;
    price: number;
    imageUrl: string;
  };
}

export interface OptimizedCartItem {
  id: number;
  qty: number;
}
