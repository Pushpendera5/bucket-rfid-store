import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchInventory = createAsyncThunk('inventory/fetch', async () => {
  const res = await api.getInventory();
  return res;
});

export const addInventory = createAsyncThunk('inventory/add', async (payload) => {
  const res = await api.createInventory(payload);
  return res;
});

export const deleteInventory = createAsyncThunk('inventory/delete', async (id) => {
  await api.deleteInventory(id);
  return id;
});

export const updateInventory = createAsyncThunk('inventory/update', async ({ id, payload }) => {
  const res = await api.updateInventory(id, payload);
  return res;
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchInventory.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchInventory.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })

      .addCase(addInventory.fulfilled, (s, a) => { s.items.unshift(a.payload); })
      .addCase(deleteInventory.fulfilled, (s, a) => { s.items = s.items.filter((it) => it.id !== a.payload); })
      .addCase(updateInventory.fulfilled, (s, a) => {
        const index = s.items.findIndex((it) => it.id === a.payload.id);
        if (index !== -1) s.items[index] = a.payload;
      });
  },
});

export default inventorySlice.reducer;
