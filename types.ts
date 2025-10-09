// types.ts

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  description: string;
  imageUrl: string;
  images?: string[];
  stock: number;
  category: string;
  rating: number;
  reviews: number;
  createdAt: string;
}

/**
 * Represents a customized T-shirt design.
 * Instead of storing individual design elements, we store the final rendered image
 * for a more accurate and robust representation in the cart and order.
 */
export interface Customization {
  finalDesignUrl: string; // The generated composite image of the final design on the t-shirt
  colorName: string;      // e.g., 'أبيض', 'أسود', 'مخصص'
  size: string;           // 'S', 'M', 'L', etc.
}


export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  customization?: Customization;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}
