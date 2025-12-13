# Scripture Playlist App

A mobile app that lets users create Scripture playlists and consume them in two ways:
1. **Listen Mode**: AI text-to-speech reads the playlist like an audio queue
2. **Read Mode**: The same playlist is presented as swipeable reading cards

## Features

### Playlist Creation
- **Manual Entry**: Enter verse references (verse/range/chapter/book)
- **AI-Powered**: Describe what you need and get a curated playlist

### Consumption Modes
- **Listen Mode**: Full audio player with play/pause, skip, progress tracking
- **Read Mode**: Swipeable cards with adjustable text size and night mode

### Pre-built Modes
- **Bedtime**: Calmer voice, longer pauses, peaceful passages
- **Commute**: Standard pace, 15-30 min playlists
- **Study**: Verse numbers spoken, focused passages
- **Prayer Loop**: Loop selected passages for meditation

### Library & Organization
- Save and favorite playlists
- Recent playlists
- Search and filter

## Project Structure

```
src/
├── components/       # Reusable UI components
├── screens/          # Screen components
│   ├── HomeScreen.tsx
│   ├── LibraryScreen.tsx
│   ├── CreatePlaylistScreen.tsx
│   ├── PromptPlaylistScreen.tsx
│   ├── PlaylistDetailScreen.tsx
│   ├── ListenModeScreen.tsx
│   ├── ReadModeScreen.tsx
│   ├── ModesScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── OnboardingScreen.tsx
│   └── EditPlaylistScreen.tsx
├── navigation/       # Navigation configuration
│   └── RootNavigator.tsx
├── services/         # Business logic
│   ├── bibleParser.ts      # Reference parsing
│   ├── bibleData.ts        # Bible text data
│   ├── playlistCompiler.ts # Compile playlists
│   └── playlistGenerator.ts # AI generation
├── state/            # Zustand stores
│   ├── preferencesStore.ts
│   └── playlistStore.ts
├── types/            # TypeScript types
│   └── bible.ts
└── api/              # API clients
```

## State Management

Using Zustand with AsyncStorage persistence:
- **preferencesStore**: User settings (translation, voice, speed, etc.)
- **playlistStore**: Playlists, favorites, recent, playback state

## Supported Reference Formats

- Single verse: `John 3:16`
- Verse range: `John 3:16-18`
- Chapter: `Romans 8`
- Chapter range: `Romans 8-10`
- Whole book: `James`
- Abbreviations: `Ps`, `Rom`, `Matt`

## Translations

- **KJV**: King James Version (stored locally)
- **NIV**: New International Version (API-based, coming soon)

## Tech Stack

- Expo SDK 53
- React Native 0.76
- TypeScript
- NativeWind (TailwindCSS)
- Zustand for state
- expo-speech for TTS
- react-native-pager-view for reading cards
