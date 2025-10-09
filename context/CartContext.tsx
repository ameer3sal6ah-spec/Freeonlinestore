
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, Customization } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'cartItemId' | 'quantity'>, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const localData = localStorage.getItem('cartItems');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (newItem: Omit<CartItem, 'cartItemId' | 'quantity'>, quantity: number = 1) => {
    setCartItems(prevItems => {
      // For standard products, check if it already exists
      if (!newItem.customization) {
          const existingItem = prevItems.find(item => !item.customization && item.product.id === newItem.product.id);
          if (existingItem) {
              return prevItems.map(item =>
                  item.cartItemId === existingItem.cartItemId ? { ...item, quantity: item.quantity + quantity } : item
              );
          }
      }
      
      // For new items (custom or standard), add them with a unique ID
      const itemToAdd: CartItem = {
          ...newItem,
          quantity,
          cartItemId: `${newItem.product.id}-${Date.now()}` // Generate a unique ID
      };
      
      return [...prevItems, itemToAdd];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};