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

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const setUser = useUserStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.signIn(email, password);
      setUser(user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    const skipStore = useUserStore.getState();
    skipStore.setHasSeenAuthPrompt(true);
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
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
            {/* Header */}
            <View className="items-center mb-12">
              <View className="w-20 h-20 rounded-3xl bg-white/20 items-center justify-center mb-4">
                <Ionicons name="book" size={40} color="white" />
              </View>
              <Text className="text-white text-3xl font-bold">Welcome Back</Text>
              <Text className="text-white/70 text-base mt-2 text-center">
                Sign in to sync your playlists across devices
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6">
                <Text className="text-red-300 text-center">{error}</Text>
              </View>
            )}

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
            <View className="mb-6">
              <Text className="text-white/70 text-sm mb-2">Password</Text>
              <View className="bg-white/10 rounded-xl flex-row items-center px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
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

            {/* Sign In Button */}
            <Pressable
              onPress={handleSignIn}
              disabled={isLoading}
              className="bg-white rounded-xl py-4 mb-4 active:opacity-80"
            >
              {isLoading ? (
                <ActivityIndicator color="#4f46e5" />
              ) : (
                <Text className="text-indigo-600 font-bold text-center text-lg">
                  Sign In
                </Text>
              )}
            </Pressable>

            {/* Sign Up Link */}
            <Pressable
              onPress={() => navigation.navigate("SignUp")}
              className="py-3 mb-4"
            >
              <Text className="text-white/70 text-center">
                {"Don't have an account? "}
                <Text className="text-white font-semibold">Sign Up</Text>
              </Text>
            </Pressable>

            {/* Skip Button */}
            <Pressable onPress={handleSkip} className="py-3">
              <Text className="text-white/50 text-center text-sm">
                Continue without an account
              </Text>
            </Pressable>

            {/* Info */}
            <View className="mt-auto pt-8">
              <View className="bg-white/10 rounded-xl p-4">
                <View className="flex-row items-start mb-3">
                  <Ionicons name="cloud-outline" size={20} color="rgba(255,255,255,0.7)" />
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium mb-1">Cloud Sync</Text>
                    <Text className="text-white/60 text-sm">
                      Access your playlists on any device
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-start">
                  <Ionicons name="shield-checkmark-outline" size={20} color="rgba(255,255,255,0.7)" />
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium mb-1">Secure & Private</Text>
                    <Text className="text-white/60 text-sm">
                      Your data is encrypted and secure
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
