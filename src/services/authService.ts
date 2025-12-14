import * as SecureStore from "expo-secure-store";
import { analyticsService } from "./analyticsService";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://your-backend-api.com";

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

class AuthService {
  private currentUser: User | null = null;

  async initialize(): Promise<User | null> {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      if (token) {
        const user = await this.verifyToken(token);
        this.currentUser = user;
        return user;
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    }
    return null;
  }

  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sign up failed");
      }

      const data = await response.json();
      await this.storeTokens(data.tokens);
      this.currentUser = data.user;

      // Track sign up event
      analyticsService.trackEvent("user_signup", {
        userId: data.user.id,
        email: data.user.email,
      });

      return data.user;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sign in failed");
      }

      const data = await response.json();
      await this.storeTokens(data.tokens);
      this.currentUser = data.user;

      // Track sign in event
      analyticsService.trackEvent("user_signin", {
        userId: data.user.id,
        email: data.user.email,
      });

      return data.user;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      if (token) {
        await fetch(`${API_BASE_URL}/auth/signout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      await this.clearTokens();
      this.currentUser = null;
    }
  }

  async verifyToken(token: string): Promise<User> {
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
}

export const authService = new AuthService();
