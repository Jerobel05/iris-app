import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, UserOut } from "@/lib/api";

interface AuthContextType {
  user: UserOut | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("iris_token"));
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem("iris_token"));

  useEffect(() => {
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("iris_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    localStorage.setItem("iris_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, fullName?: string) => {
    await authApi.register(email, password, fullName);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("iris_token");
    localStorage.removeItem("iris_gmail");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
