import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import inventoryReducer from './slices/inventorySlice';
import vendorReducer from './slices/vendorSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    inventory: inventoryReducer,
    vendor: vendorReducer,
  },
});

export default store;
