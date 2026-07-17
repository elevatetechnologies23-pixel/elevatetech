import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  gstPercentage: number;
  quantity: number;
  stock: number;
  variantName?: string;
}

interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
}

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  shipping: number;
  totalQuantity: number;
  subTotal: number;
  gstAmount: number;
  discountAmount: number;
  grandTotal: number;
}

const getCartFromStorage = (): CartItem[] => {
  try {
    const data = localStorage.getItem('cartItems');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const initialItems = getCartFromStorage();
let initialSubtotal = 0;
let initialGst = 0;
let initialQty = 0;

initialItems.forEach((item) => {
  const itemSubtotal = item.price * item.quantity;
  initialSubtotal += itemSubtotal;
  initialGst += itemSubtotal * (item.gstPercentage / 100);
  initialQty += item.quantity;
});

const initialState: CartState = {
  items: initialItems,
  coupon: null,
  shipping: 100, // Default 100 shipping fee
  totalQuantity: initialQty,
  subTotal: initialSubtotal,
  gstAmount: initialGst,
  discountAmount: 0,
  grandTotal: Math.max(0, initialSubtotal + initialGst + 100),
};

// Helper function to recalculate all totals
const recalculateTotals = (state: CartState) => {
  let subTotal = 0;
  let gstAmount = 0;
  let totalQuantity = 0;

  state.items.forEach((item) => {
    const itemSubtotal = item.price * item.quantity;
    subTotal += itemSubtotal;
    // Calculate GST based on price excluding GST or including GST?
    // Let's assume price is base price and GST is added on top.
    gstAmount += itemSubtotal * (item.gstPercentage / 100);
    totalQuantity += item.quantity;
  });

  state.subTotal = subTotal;
  state.gstAmount = gstAmount;
  state.totalQuantity = totalQuantity;

  // Coupon discount
  let discount = 0;
  if (state.coupon) {
    if (state.coupon.minPurchase && subTotal < state.coupon.minPurchase) {
      state.coupon = null; // Invalidate coupon
    } else {
      if (state.coupon.discountType === 'percentage') {
        discount = subTotal * (state.coupon.discountValue / 100);
      } else {
        discount = state.coupon.discountValue;
      }
    }
  }

  state.discountAmount = Math.min(discount, subTotal);
  
  // Grand Total = subtotal + gst + shipping - discount
  state.grandTotal = Math.max(0, state.subTotal + state.gstAmount + state.shipping - state.discountAmount);
  
  localStorage.setItem('cartItems', JSON.stringify(state.items));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;
      const existingItem = state.items.find((item) => item.id === newItem.id);

      if (existingItem) {
        const potentialQty = existingItem.quantity + newItem.quantity;
        existingItem.quantity = Math.min(potentialQty, existingItem.stock);
      } else {
        state.items.push({ ...newItem, quantity: Math.min(newItem.quantity, newItem.stock) });
      }
      recalculateTotals(state);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      recalculateTotals(state);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload;
      const existingItem = state.items.find((item) => item.id === id);
      if (existingItem && quantity > 0) {
        existingItem.quantity = Math.min(quantity, existingItem.stock);
      }
      recalculateTotals(state);
    },
    applyCoupon: (state, action: PayloadAction<Coupon>) => {
      state.coupon = action.payload;
      recalculateTotals(state);
    },
    removeCoupon: (state) => {
      state.coupon = null;
      recalculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.coupon = null;
      state.totalQuantity = 0;
      state.subTotal = 0;
      state.gstAmount = 0;
      state.discountAmount = 0;
      state.grandTotal = 0;
      localStorage.removeItem('cartItems');
    },
    initializeCartTotals: (state) => {
      recalculateTotals(state);
    }
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
  initializeCartTotals,
} = cartSlice.actions;

export default cartSlice.reducer;
