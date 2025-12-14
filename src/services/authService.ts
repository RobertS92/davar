import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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

// Check if backend is configured
const isBackendConfigured = (): boolean => {
  return !!API_BASE_URL && !API_BASE_URL.includes("your-backend");
};

// Generate a simple ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

class AuthService {
  private currentUser: User | null = null;

  async initialize(): Promise<User | null> {
    try {
      // Try to load user from local storage first
      const storedUser = await AsyncStorage.getItem("local_user");
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        return this.currentUser;
      }

      // If backend is configured, try to verify token
      if (isBackendConfigured()) {
        const token = await SecureStore.getItemAsync("auth_token");
        if (token) {
          const user = await this.verifyToken(token);
          this.currentUser = user;
          return user;
        }
      }
    } catch (error) {
      console.log("Auth initialization - no existing session");
    }
    return null;
  }

  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    // If backend is not configured, create local user
    if (!isBackendConfigured()) {
      return this.createLocalUser(email, displayName);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      // Check if response is JSON
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

      return data.user;
    } catch (error) {
      console.log("Backend unavailable, creating local user");
      return this.createLocalUser(email, displayName);
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    // If backend is not configured, check local user
    if (!isBackendConfigured()) {
      return this.signInLocal(email);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is JSON
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

      return data.user;
    } catch (error) {
      // Try local sign in as fallback
      return this.signInLocal(email);
    }
  }

  private async createLocalUser(email: string, displayName?: string): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      id: generateId(),
      email,
      displayName: displayName || email.split("@")[0],
      createdAt: now,
      lastLoginAt: now,
    };

    this.currentUser = user;
    await AsyncStorage.setItem("local_user", JSON.stringify(user));
    await AsyncStorage.setItem("local_user_email", email);

    return user;
  }

  private async signInLocal(email: string): Promise<User> {
    const storedEmail = await AsyncStorage.getItem("local_user_email");
    const storedUser = await AsyncStorage.getItem("local_user");

    if (storedUser && storedEmail === email) {
      const user = JSON.parse(storedUser);
      user.lastLoginAt = new Date().toISOString();
      this.currentUser = user;
      await AsyncStorage.setItem("local_user", JSON.stringify(user));
      return user;
    }

    // Create new local user if none exists
    return this.createLocalUser(email);
  }

  async signOut(): Promise<void> {
    try {
      if (isBackendConfigured()) {
        const token = await SecureStore.getItemAsync("auth_token");
        if (token) {
          await fetch(`${API_BASE_URL}/auth/signout`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          }).catch(() => {});
        }
      }
    } catch (error) {
      // Ignore sign out errors
    } finally {
      await this.clearTokens();
      await AsyncStorage.removeItem("local_user");
      await AsyncStorage.removeItem("local_user_email");
      this.currentUser = null;
    }
  }

  async verifyToken(token: string): Promise<User> {
    if (!isBackendConfigured()) {
      throw new Error("Backend not configured");
    }

    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        "Authorization": `Bearer ${token}`,
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
