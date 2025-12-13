import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore } from "../state/playlistStore";
import { usePreferencesStore } from "../state/preferencesStore";
import { generatePlaylistWithAI } from "../services/playlistGenerator";
import { compilePlaylist } from "../services/playlistCompiler";
import { parseReferences } from "../services/bibleParser";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Station {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: readonly [string, string];
  prompt: string;
  tags: string[];
}

const STATIONS: Station[] = [
  {
    id: "faith",
    title: "Faith",
    subtitle: "Build unwavering trust in God",
    icon: "flame",
    colors: ["#f59e0b", "#dc2626"] as const,
    prompt: "Passages about faith, trusting God, believing His promises, and walking by faith not by sight. Include stories of faith from Hebrews 11, teachings of Jesus on faith, and Paul's writings on justification by faith.",
    tags: ["faith", "trust", "belief"],
  },
  {
    id: "lust",
    title: "Overcoming Lust",
    subtitle: "Purity and self-control",
    icon: "shield-checkmark",
    colors: ["#6366f1", "#4f46e5"] as const,
    prompt: "Passages about purity, fleeing sexual immorality, renewing the mind, self-control, and the power of the Holy Spirit to overcome temptation. Include practical wisdom from Proverbs, teachings from Jesus on the heart, and Paul's instructions on the flesh vs spirit.",
    tags: ["purity", "self-control", "overcoming"],
  },
  {
    id: "overcoming",
    title: "Overcoming",
    subtitle: "Victory through Christ",
    icon: "trophy",
    colors: ["#10b981", "#059669"] as const,
    prompt: "Passages about overcoming trials, spiritual warfare, being more than conquerors, and victory in Christ. Include encouragement from Romans 8, spiritual armor from Ephesians 6, and promises of overcoming from Revelation.",
    tags: ["victory", "strength", "perseverance"],
  },
  {
    id: "obedience",
    title: "Obedience",
    subtitle: "Walking in His ways",
    icon: "footsteps",
    colors: ["#8b5cf6", "#7c3aed"] as const,
    prompt: "Passages about obedience to God, keeping His commandments, the blessings of obedience, and Jesus as our example of perfect obedience. Include teachings from Deuteronomy, the Sermon on the Mount, and James on being doers of the word.",
    tags: ["obedience", "commandments", "discipleship"],
  },
  {
    id: "narrow-path",
    title: "The Narrow Path",
    subtitle: "Radical discipleship",
    icon: "compass",
    colors: ["#0ea5e9", "#0284c7"] as const,
    prompt: "Passages about the narrow gate, counting the cost of discipleship, denying self, taking up the cross, and following Jesus wholeheartedly. Include hard teachings of Jesus, warnings about compromise, and examples of radical faith.",
    tags: ["discipleship", "commitment", "holiness"],
  },
  {
    id: "fatherhood",
    title: "Fatherhood",
    subtitle: "Leading your family well",
    icon: "man",
    colors: ["#14b8a6", "#0d9488"] as const,
    prompt: "Passages about being a godly father, leading your household, teaching children the ways of God, patience, discipline in love, and the Father heart of God as our model. Include Proverbs on raising children, Ephesians on fathers, and examples of fathers in Scripture.",
    tags: ["fatherhood", "family", "leadership"],
  },
  {
    id: "motherhood",
    title: "Motherhood",
    subtitle: "Nurturing with wisdom",
    icon: "woman",
    colors: ["#ec4899", "#db2777"] as const,
    prompt: "Passages about godly motherhood, the value of a virtuous woman, nurturing children in faith, wisdom in the home, and trusting God with your children. Include Proverbs 31, examples of faithful mothers in Scripture, and encouragement for weary mothers.",
    tags: ["motherhood", "family", "wisdom"],
  },
  {
    id: "marriage",
    title: "Marriage",
    subtitle: "Covenant love",
    icon: "heart-circle",
    colors: ["#f43f5e", "#e11d48"] as const,
    prompt: "Passages about marriage as God designed it, loving your spouse sacrificially, unity and oneness, forgiveness in marriage, and Christ and the church as the model. Include Ephesians 5, Song of Solomon, and practical wisdom from Proverbs.",
    tags: ["marriage", "love", "covenant"],
  },
  {
    id: "work",
    title: "Work",
    subtitle: "Working as unto the Lord",
    icon: "briefcase",
    colors: ["#78716c", "#57534e"] as const,
    prompt: "Passages about work ethic, working heartily as for the Lord, integrity in business, avoiding laziness, finding purpose in labor, and stewarding resources well. Include Colossians on work, Proverbs on diligence, and teachings on using talents wisely.",
    tags: ["work", "diligence", "integrity"],
  },
];

export default function StationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const addPlaylist = usePlaylistStore((s) => s.addPlaylist);
  const addToRecent = usePlaylistStore((s) => s.addToRecent);
  const defaultTranslation = usePreferencesStore((s) => s.defaultTranslation);
  const defaultPlaylistLength = usePreferencesStore((s) => s.defaultPlaylistLength);

  const [loadingStation, setLoadingStation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStationPress = async (station: Station) => {
    setLoadingStation(station.id);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Generate playlist using AI
      const plan = await generatePlaylistWithAI({
        prompt: station.prompt,
        targetLength: defaultPlaylistLength,
        tones: [],
        translation: defaultTranslation,
      });

      // Parse and compile the playlist
      const parsed = parseReferences(plan.references.join("\n"));

      if (parsed.references.length === 0) {
        throw new Error("No valid references generated");
      }

      const playlist = await compilePlaylist({
        title: `${station.title} Station`,
        references: parsed.references,
        translation: defaultTranslation,
        sourceType: "prompt",
        promptUsed: station.prompt,
        tags: station.tags,
      });

      addPlaylist(playlist);
      addToRecent(playlist.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate directly to listen mode
      navigation.navigate("ListenMode", { playlistId: playlist.id });

    } catch (err) {
      console.log("Station error:", err);
      setError("Failed to generate station. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoadingStation(null);
    }
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Text className="text-white text-3xl font-bold">Stations</Text>
        <Text className="text-neutral-400 text-base mt-1">
          Continuous Scripture by topic
        </Text>
      </View>

      {error && (
        <View className="mx-5 mb-4 bg-red-500/20 rounded-xl p-4">
          <Text className="text-red-400 text-center">{error}</Text>
        </View>
      )}

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap justify-between">
          {STATIONS.map((station) => (
            <Pressable
              key={station.id}
              onPress={() => handleStationPress(station)}
              disabled={loadingStation !== null}
              className="w-[48%] mb-4 overflow-hidden rounded-2xl active:opacity-80"
              style={{ opacity: loadingStation && loadingStation !== station.id ? 0.5 : 1 }}
            >
              <LinearGradient
                colors={station.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16, minHeight: 140 }}
              >
                {loadingStation === station.id ? (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="white" size="large" />
                    <Text className="text-white/80 text-sm mt-2">Loading...</Text>
                  </View>
                ) : (
                  <>
                    <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mb-3">
                      <Ionicons name={station.icon} size={24} color="white" />
                    </View>
                    <Text className="text-white font-bold text-lg">
                      {station.title}
                    </Text>
                    <Text className="text-white/70 text-sm mt-1" numberOfLines={2}>
                      {station.subtitle}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* How it works */}
        <View className="bg-neutral-900 rounded-2xl p-5 mt-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="radio" size={24} color="#6366f1" />
            <Text className="text-white font-semibold text-lg ml-3">
              How Stations Work
            </Text>
          </View>
          <Text className="text-neutral-400 leading-6">
            Tap a station to generate a Scripture playlist tailored to that topic.
            AI selects relevant passages and creates a {defaultPlaylistLength}-minute
            listening experience with natural voice narration.
          </Text>
          <View className="flex-row items-center mt-4 gap-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color="#9ca3af" />
              <Text className="text-neutral-500 text-sm ml-1">{defaultPlaylistLength} min</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="language-outline" size={16} color="#9ca3af" />
              <Text className="text-neutral-500 text-sm ml-1">{defaultTranslation}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
