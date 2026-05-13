import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchVendors = createAsyncThunk('vendor/fetch', async () => {
  const res = await api.getVendors();
  return res;
});

export const addVendor = createAsyncThunk('vendor/add', async (payload) => {
  const res = await api.createVendor(payload);
  return res;
});

export const deleteVendor = createAsyncThunk('vendor/delete', async (id) => {
  await api.deleteVendor(id);
  return id;
});

const vendorSlice = createSlice({
  name: 'vendor',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchVendors.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchVendors.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })
      .addCase(addVendor.fulfilled, (s, a) => { s.items.push(a.payload); })
      .addCase(deleteVendor.fulfilled, (s, a) => { s.items = s.items.filter((it) => it.id !== a.payload); });
  },
});

export default vendorSlice.reducer;
