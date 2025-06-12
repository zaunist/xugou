import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
} from "../api/auth";
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthContextType,
} from "../types";
import { useTranslation } from "react-i18next";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    // 从 localStorage 获取 token 和 user
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 如果有 token，但没有 user，则获取用户信息
    if (token && !user) {
      fetchCurrentUser();
    }
  }, [token, user]);

  const fetchCurrentUser = async () => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
      } else {
        // 如果获取用户信息失败，清除 token 和 user
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error(t("auth.error.fetchUser"), error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      const response = await apiLogin(data);
      if (response.success && response.token && response.user) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        setToken(response.token);
        setUser(response.user);
      }
      return { success: response.success, message: response.message };
    } catch (error) {
      console.error(t("auth.error.login"), error);
      return { success: false, message: t("login.error.tryAgain") };
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await apiRegister(data);
      return { success: response.success, message: response.message };
    } catch (error) {
      console.error(t("auth.error.register"), error);
      return { success: false, message: t("register.error.tryAgain") };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
