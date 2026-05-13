import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  darkMode: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
  },
});

export const { toggleSidebar, toggleDarkMode } = uiSlice.actions;
export default uiSlice.reducer;
