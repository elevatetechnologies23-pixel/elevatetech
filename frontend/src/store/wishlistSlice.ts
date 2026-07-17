import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ProductItem } from '../utils/mockData';

interface WishlistState {
  items: ProductItem[];
}

const storedWishlist = localStorage.getItem('wishlist');
let initialItems: ProductItem[] = [];
if (storedWishlist) {
  try {
    initialItems = JSON.parse(storedWishlist);
  } catch {
    localStorage.removeItem('wishlist');
  }
}

const initialState: WishlistState = {
  items: initialItems,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<ProductItem>) => {
      const exists = state.items.some(
        (item) => (item.id || (item as any)._id) === (action.payload.id || (action.payload as any)._id)
      );
      if (!exists) {
        state.items.push(action.payload);
        localStorage.setItem('wishlist', JSON.stringify(state.items));
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => (item.id || (item as any)._id) !== action.payload
      );
      localStorage.setItem('wishlist', JSON.stringify(state.items));
    },
    clearWishlist: (state) => {
      state.items = [];
      localStorage.removeItem('wishlist');
    },
  },
});

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
