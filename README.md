# Scripture Playlist App

A mobile app that lets users create Scripture playlists and consume them in two ways:
1. **Listen Mode**: AI text-to-speech reads the playlist like an audio queue
2. **Read Mode**: The same playlist is presented as swipeable reading cards

## Features

### Stations (Pandora-like)
Tap a topic to instantly generate a Scripture playlist with AI voice narration:
- **The Messiah** - Journey through Matthew, Mark, Luke, John, and Revelation
- **The Kings** - David and Solomon's stories
- **Famous Stories** - Moses, Joshua, Gideon, Daniel, Joseph, Abraham, Jacob, and more
- **Stewardship** - Managing God's resources faithfully
- **Faith** - Build unwavering trust in God
- **Overcoming Lust** - Purity and self-control
- **Overcoming** - Victory through Christ
- **Obedience** - Walking in His ways
- **The Narrow Path** - Radical discipleship
- **Fatherhood** - Leading your family well
- **Motherhood** - Nurturing with wisdom
- **Marriage** - Covenant love
- **Work** - Working as unto the Lord

### Playlist Creation
- **Manual Entry**: Enter verse references (verse/range/chapter/book)
- **AI-Powered**: Describe what you need and get a curated playlist

### Consumption Modes
- **Listen Mode**: Full audio player with AI TTS, play/pause, skip, progress tracking
- **Read Mode**: Swipeable cards with adjustable text size and night mode

### AI Voice Options
6 natural-sounding voices powered by OpenAI TTS:
- Alloy (Neutral, balanced)
- Echo (Male, warm)
- Fable (Male, British narrative)
- Onyx (Male, deep authoritative)
- Nova (Female, friendly)
- Shimmer (Female, soft gentle)

### Pre-built Modes
- **Bedtime**: Calmer voice, longer pauses, peaceful passages with sleep timer
- **Commute**: Standard pace, 15-30 min playlists
- **Study**: Verse numbers spoken, focused passages
- **Prayer Loop**: Loop selected passages for meditation

### Sleep Timer
Set a timer to automatically stop playback after:
- 5, 10, 15, 30, 45, or 60 minutes
- Perfect for bedtime listening
- Visual indicator shows remaining time
- Available in Listen Mode

### Deep Dive Study (NEW)
Extended 60-120 minute study sessions with comprehensive content:
- **Study Types**:
  - Precepts: Key verses and teachings
  - Stories: Narrative passages (e.g., Abraham, David, Joseph)
  - Chapters: Full chapter studies
  - Books: Complete book studies
  - Mixed: Combination of all types
- **13 Study Topics**:
  - Faith & Trust
  - Salvation
  - Holiness & Purity
  - Wisdom
  - Prayer
  - Spiritual Warfare
  - Love of God
  - Kingdom of God
  - Obedience
  - Suffering & Trials
  - Identity in Christ
  - Promises of God
  - Stewardship

### Library & Organization
- Save and favorite playlists
- Recent playlists
- Search and filter by title, tags, description, or verse references
- **Offline Mode**: Download playlists for offline listening
  - Pre-cache all audio for a playlist
  - Progress indicator during download
  - Works without internet connection
  - Visual indicator for downloaded playlists

## Project Structure

```
src/
├── components/       # Reusable UI components
├── screens/          # Screen components
│   ├── HomeScreen.tsx
│   ├── StationsScreen.tsx
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
│   ├── bibleData.ts        # Bible text data (KJV local, NIV API)
│   ├── playlistCompiler.ts # Compile playlists
│   ├── playlistGenerator.ts # AI generation
│   ├── deepDiveGenerator.ts # Deep dive study generation
│   ├── ttsService.ts       # OpenAI TTS audio generation
│   └── offlineService.ts   # Offline playlist downloads
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

- **KJV**: King James Version (default, stored locally)
- **NIV**: New International Version (optional, requires API key from api.bible)
  - To enable NIV: Add `EXPO_PUBLIC_BIBLE_API_KEY` to your environment variables
  - NIV option will automatically appear in settings when API key is configured

## Environment

Copy `.env.example` to `.env` and fill in keys:

- `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY` — required for AI playlist generation and Listen Mode TTS
- `EXPO_PUBLIC_API_URL` — optional hosted backend URL for cloud auth/sync (or set it in Settings)
- `EXPO_PUBLIC_BIBLE_API_KEY` — optional api.bible key to enable NIV

Placeholder values are ignored. Settings → Services shows live configuration status.

## Backend

The Express backend in `backend/` provides auth, playlist sync, and analytics.

```bash
cd backend
npm install
npm start
```

Then set `EXPO_PUBLIC_API_URL` (or Settings → Cloud Backend) to that server URL.
