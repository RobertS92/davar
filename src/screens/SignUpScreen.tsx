import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "../navigation/RootNavigator";
import { authService } from "../services/authService";
import { useUserStore } from "../state/userStore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const setUser = useUserStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.signUp(email, password, displayName || undefined);
      setUser(user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <LinearGradient
        colors={["#4f46e5", "#1e1b4b", "#0a0a0a"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6">
            {/* Back Button */}
            <Pressable
              onPress={() => navigation.goBack()}
              className="mb-8 self-start"
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={28} color="white" />
            </Pressable>

            {/* Header */}
            <View className="mb-8">
              <Text className="text-white text-3xl font-bold">Create Account</Text>
              <Text className="text-white/70 text-base mt-2">
                Join to sync your playlists and access advanced features
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6">
                <Text className="text-red-300 text-center">{error}</Text>
              </View>
            )}

            {/* Name Input */}
            <View className="mb-4">
              <Text className="text-white/70 text-sm mb-2">Name (Optional)</Text>
              <View className="bg-white/10 rounded-xl flex-row items-center px-4 py-3">
                <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.7)" />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="words"
                  autoComplete="name"
                  className="flex-1 text-white ml-3 text-base"
                />
              </View>
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-white/70 text-sm mb-2">Email</Text>
              <View className="bg-white/10 rounded-xl flex-row items-center px-4 py-3">
                <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  className="flex-1 text-white ml-3 text-base"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <Text className="text-white/70 text-sm mb-2">Password</Text>
              <View className="bg-white/10 rounded-xl flex-row items-center px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  className="flex-1 text-white ml-3 text-base"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="rgba(255,255,255,0.7)"
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text className="text-white/70 text-sm mb-2">Confirm Password</Text>
              <View className="bg-white/10 rounded-xl flex-row items-center px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  className="flex-1 text-white ml-3 text-base"
                />
              </View>
            </View>

            {/* Sign Up Button */}
            <Pressable
              onPress={handleSignUp}
              disabled={isLoading}
              className="bg-white rounded-xl py-4 mb-4 active:opacity-80"
            >
              {isLoading ? (
                <ActivityIndicator color="#4f46e5" />
              ) : (
                <Text className="text-indigo-600 font-bold text-center text-lg">
                  Create Account
                </Text>
              )}
            </Pressable>

            {/* Terms */}
            <Text className="text-white/50 text-xs text-center mb-4 px-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>

            {/* Sign In Link */}
            <Pressable
              onPress={() => navigation.goBack()}
              className="py-3"
            >
              <Text className="text-white/70 text-center">
                Already have an account?{" "}
                <Text className="text-white font-semibold">Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
