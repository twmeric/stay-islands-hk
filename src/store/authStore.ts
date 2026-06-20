import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  isChecking: boolean;
  isAdmin: boolean;
  adminRole: string | null;
  setUser: (user: AuthUser | null) => void;
  setChecking: (value: boolean) => void;
  setAdminStatus: (isAdmin: boolean, role: string | null) => void;
  reset: () => void;
}

const loggedOutState = {
  user: null,
  isChecking: false,
  isAdmin: false,
  adminRole: null,
};

function createAuthStore() {
  try {
    return create<AuthState>()(
      persist(
        (set) => ({
          ...loggedOutState,
          isChecking: true,
          setUser: (user) => set({ user }),
          setChecking: (value) => set({ isChecking: value }),
          setAdminStatus: (isAdmin, role) => set({ isAdmin, adminRole: role }),
          reset: () => set({ ...loggedOutState }),
        }),
        {
          name: 'stayislands-auth',
          partialize: (state) => ({
            user: state.user,
            isAdmin: state.isAdmin,
            adminRole: state.adminRole,
          }),
        }
      )
    );
  } catch (err) {
    console.error('Auth store initialization failed, falling back to non-persisted logged-out state:', err);
    return create<AuthState>((set) => ({
      ...loggedOutState,
      setUser: (user) => set({ user }),
      setChecking: (value) => set({ isChecking: value }),
      setAdminStatus: (isAdmin, role) => set({ isAdmin, adminRole: role }),
      reset: () => set({ ...loggedOutState }),
    }));
  }
}

export const useAuthStore = createAuthStore();
