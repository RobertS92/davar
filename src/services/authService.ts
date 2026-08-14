import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl, isBackendConfigured } from "../api/config";

export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

class AuthService {
  private currentUser: User | null = null;

  async initialize(): Promise<User | null> {
    try {
      const storedUser = await AsyncStorage.getItem("local_user");
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }

      if (isBackendConfigured()) {
        const token = await SecureStore.getItemAsync("auth_token");
        if (token) {
          try {
            const user = await this.verifyToken(token);
            this.currentUser = user;
            await AsyncStorage.setItem("local_user", JSON.stringify(user));
            return user;
          } catch {
            // Token invalid — keep local user if present
          }
        }
      }

      return this.currentUser;
    } catch {
      return null;
    }
  }

  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    const baseUrl = getApiBaseUrl();

    if (!isBackendConfigured() || !baseUrl) {
      return this.createLocalUser(email, displayName);
    }

    try {
      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Backend server not available. Creating local account.");
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sign up failed");
      }

      const data = await response.json();
      await this.storeTokens(data.tokens);
      this.currentUser = data.user;
      await AsyncStorage.setItem("local_user", JSON.stringify(data.user));
      await AsyncStorage.setItem("local_user_email", email);

      return data.user;
    } catch (error) {
      if (error instanceof Error && error.message && !error.message.includes("Backend")) {
        // Real API validation errors should surface
        if (
          error.message.toLowerCase().includes("email") ||
          error.message.toLowerCase().includes("password") ||
          error.message.toLowerCase().includes("required") ||
          error.message.toLowerCase().includes("registered")
        ) {
          throw error;
        }
      }
      return this.createLocalUser(email, displayName);
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    const baseUrl = getApiBaseUrl();

    if (!isBackendConfigured() || !baseUrl) {
      return this.signInLocal(email, password);
    }

    try {
      const response = await fetch(`${baseUrl}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Backend server not available");
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sign in failed");
      }

      const data = await response.json();
      await this.storeTokens(data.tokens);
      this.currentUser = data.user;
      await AsyncStorage.setItem("local_user", JSON.stringify(data.user));
      await AsyncStorage.setItem("local_user_email", email);

      return data.user;
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid credentials") {
        throw error;
      }
      return this.signInLocal(email, password);
    }
  }

  private async createLocalUser(email: string, displayName?: string): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      id: generateId(),
      email: email.trim().toLowerCase(),
      displayName: displayName || email.split("@")[0],
      createdAt: now,
      lastLoginAt: now,
    };

    this.currentUser = user;
    await AsyncStorage.setItem("local_user", JSON.stringify(user));
    await AsyncStorage.setItem("local_user_email", user.email);
    return user;
  }

  private async signInLocal(email: string, _password?: string): Promise<User> {
    const normalized = email.trim().toLowerCase();
    const storedEmail = await AsyncStorage.getItem("local_user_email");
    const storedUser = await AsyncStorage.getItem("local_user");

    if (storedUser && storedEmail === normalized) {
      const user = JSON.parse(storedUser) as User;
      user.lastLoginAt = new Date().toISOString();
      this.currentUser = user;
      await AsyncStorage.setItem("local_user", JSON.stringify(user));
      return user;
    }

    return this.createLocalUser(normalized);
  }

  async signOut(): Promise<void> {
    try {
      const baseUrl = getApiBaseUrl();
      if (isBackendConfigured() && baseUrl) {
        const token = await SecureStore.getItemAsync("auth_token");
        if (token) {
          await fetch(`${baseUrl}/auth/signout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).catch(() => {});
        }
      }
    } catch {
      // Ignore sign out errors
    } finally {
      await this.clearTokens();
      await AsyncStorage.removeItem("local_user");
      await AsyncStorage.removeItem("local_user_email");
      this.currentUser = null;
    }
  }

  async verifyToken(token: string): Promise<User> {
    const baseUrl = getApiBaseUrl();
    if (!isBackendConfigured() || !baseUrl) {
      throw new Error("Backend not configured");
    }

    const response = await fetch(`${baseUrl}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Token verification failed");
    }

    const data = await response.json();
    return data.user;
  }

  async getAuthToken(): Promise<string | null> {
    return await SecureStore.getItemAsync("auth_token");
  }

  async storeTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync("auth_token", tokens.accessToken);
    await SecureStore.setItemAsync("refresh_token", tokens.refreshToken);
  }

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("refresh_token");
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isBackendAvailable(): boolean {
    return isBackendConfigured();
  }
}

export const authService = new AuthService();
