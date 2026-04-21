// ============================================================
// LearnSpace - Auth Store (Zustand)
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // ── Actions ──────────────────────────────────────────
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/register', data);

          // Backend sends: { success, data: { user, accessToken, refreshToken } }
          const payload = res.data?.data || res.data;
          const user = payload.user;
          const token = payload.accessToken || payload.token;
          const refreshToken = payload.refreshToken;

          if (!token || !user) {
            throw new Error('Invalid response from server: missing token or user');
          }

          set({ user, token, refreshToken, isLoading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true, user };
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Registration failed.';
          set({ error: msg, isLoading: false });
          return { success: false, message: msg };
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/login', { email, password });

          // Backend sends: { success, data: { user, accessToken, refreshToken } }
          const payload = res.data?.data || res.data;
          const user = payload.user;
          const token = payload.accessToken || payload.token;
          const refreshToken = payload.refreshToken;

          if (!token || !user) {
            throw new Error('Invalid response from server: missing token or user');
          }

          set({ user, token, refreshToken, isLoading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true, user };
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Login failed.';
          set({ error: msg, isLoading: false });
          return { success: false, message: msg };
        }
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null });
        delete api.defaults.headers.common['Authorization'];
      },

      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),

      clearError: () => set({ error: null }),

      // ── Computed ──────────────────────────────────────────
      isAuthenticated: () => !!get().token,
      isStudent: () => get().user?.role === 'student',
      isInstructor: () => get().user?.role === 'instructor',
      isAdmin: () => get().user?.role === 'admin',
      isVerifiedInstructor: () =>
        get().user?.role === 'instructor' &&
        get().user?.instructor_status === 'verified'
    }),
    {
      name: 'learnspace-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken
      })
    }
  )
);

export default useAuthStore;
