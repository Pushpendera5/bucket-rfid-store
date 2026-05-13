import { createSlice } from '@reduxjs/toolkit';

const AUTH_STORAGE_KEY = 'kdpo_auth';

const loadAuthState = () => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed?.token || !parsed?.user) return null;

    return {
      isAuthenticated: true,
      user: parsed.user,
      token: parsed.token,
    };
  } catch {
    return null;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null, // { id, name, role }
  token: null,
};

const hydratedState = typeof window !== 'undefined' ? loadAuthState() : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: hydratedState || initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ user: action.payload.user, token: action.payload.token })
        );
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;

      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
