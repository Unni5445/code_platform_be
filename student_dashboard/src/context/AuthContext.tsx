import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/config/firebase";
import { authService } from "@/services";
import type { IUser } from "@/types";

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: "SET_USER"; payload: IUser }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { user: action.payload, isAuthenticated: true, isLoading: false };
    case "LOGOUT":
      return { user: null, isAuthenticated: false, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserLocally: (user: IUser) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      const userData = res.data.data;

      if (userData.role !== "STUDENT") {
        await logout();
        return;
      }

      dispatch({ type: "SET_USER", payload: userData });
    } catch (error) {
      dispatch({ type: "LOGOUT" });
      throw error;
    }
  };

  useEffect(() => {
    refreshUser().catch(() => {});
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.signIn(email, password);
    if (res.data.success) {
      const meRes = await authService.getMe();
      const userData = meRes.data.data;
      
      if (userData.role !== "STUDENT") {
        await authService.signOut();
        throw new Error("Access denied. Only students can access this portal.");
      }
      
      dispatch({ type: "SET_USER", payload: userData });
    }
  };

  const signup = async (data: { name: string; email: string; password: string; phone?: string }) => {
    const res = await authService.signUp(data);
    if (res.data.success) {
      const meRes = await authService.getMe();
      const userData = meRes.data.data;

      if (userData.role !== "STUDENT") {
        await logout();
        throw new Error("Access denied. Only students can access this portal.");
      }

      dispatch({ type: "SET_USER", payload: userData });
    }
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const { email, displayName, uid } = result.user;
    const res = await authService.googleAuth({
      email: email!,
      name: displayName || "",
      googleId: uid,
    });
    if (res.data.success) {
      const meRes = await authService.getMe();
      const userData = meRes.data.data;

      if (userData.role !== "STUDENT") {
        await authService.signOut();
        throw new Error("Access denied. Only students can access this portal.");
      }

      dispatch({ type: "SET_USER", payload: userData });
    }
  };

  const logout = async () => {
    await authService.signOut();
    dispatch({ type: "LOGOUT" });
  };

  const updateUserLocally = (user: IUser) => {
    dispatch({ type: "SET_USER", payload: user });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, loginWithGoogle, logout, updateUserLocally, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
