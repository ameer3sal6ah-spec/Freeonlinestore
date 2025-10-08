
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
}

export interface CartItem extends Product {
  quantity: number;
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