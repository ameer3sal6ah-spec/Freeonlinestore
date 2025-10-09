export interface ProductColor {
  name: string;
  hex: string;
  imageUrl: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  description: string;
  imageUrl: string;
  images: string[];
  stock: number;
  category: string;
  rating: number;
  reviews: number;
  createdAt?: string;
  brand?: string;
  colors?: ProductColor[];
  isPopular?: boolean;
}

export interface Customization {
    color: { name: string; hex: string };
    size: string;
    logoUrl: string | null;
    basePrice: number;
    tshirtImageUrl: string;
    logoPosition?: { x: number; y: number; width: number };
    text?: {
      content: string;
      color: string;
      fontSize: number; // percentage of preview width
      fontFamily: string;
      x: number;
      y: number;
    };
}

export interface CartItem {
  cartItemId: string; // Unique ID for this specific item in the cart
  product: Product | {
      id: string;
      name:string;
      price: number;
  };
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
  createdAt: Date;
}