const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { openDatabase } = require('./db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: JWT_SECRET is not set. Set it in Railway before going live.');
}

const app = express();

// Persist SQLite on a Railway volume when DATABASE_PATH is set (e.g. /data/scripture.db)
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'scripture.db');
let db;

// CORS: reflect request Origin when CORS_ORIGIN unset; otherwise allow listed hosts
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors(
    corsOrigin
      ? {
          origin: corsOrigin.split(',').map((s) => s.trim()),
          credentials: true,
        }
      : {
          origin: true,
          credentials: true,
        }
  )
);
app.options('*', cors());
app.use(express.json({ limit: '2mb' }));

// Require DB for API routes (health stays available always)
function requireDb(req, res, next) {
  if (!db) {
    return res.status(503).json({ message: 'Database is starting up. Try again in a moment.' });
  }
  next();
}

// Health before anything else (Railway healthchecks)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', dbReady: !!db });
});

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT,
    created_at TEXT NOT NULL,
    last_login_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    items TEXT NOT NULL,
    translation TEXT NOT NULL,
    total_duration INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    source_type TEXT NOT NULL,
    prompt_used TEXT,
    tags TEXT NOT NULL,
    is_favorite INTEGER DEFAULT 0,
    last_played_at TEXT,
    completed_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    properties TEXT,
    timestamp TEXT NOT NULL,
    user_id TEXT,
    session_id TEXT,
    device_info TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration INTEGER,
    events_count INTEGER DEFAULT 0,
    device_info TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
  CREATE INDEX IF NOT EXISTS idx_events_user ON analytics_events(user_id);
  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events(timestamp);

  CREATE TABLE IF NOT EXISTS shared_playlists (
    code TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    playlist_json TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    translation TEXT,
    total_duration INTEGER DEFAULT 0,
    item_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    import_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS community_playlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    display_name TEXT,
    playlist_json TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    translation TEXT,
    total_duration INTEGER DEFAULT 0,
    item_count INTEGER DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    import_count INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS community_votes (
    user_id TEXT NOT NULL,
    playlist_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, playlist_id)
  );

  CREATE INDEX IF NOT EXISTS idx_shared_code ON shared_playlists(code);
  CREATE INDEX IF NOT EXISTS idx_community_votes ON community_playlists(vote_count DESC);
  CREATE INDEX IF NOT EXISTS idx_community_created ON community_playlists(created_at DESC);
`;

function generateShareCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

function clampLimit(raw, fallback = 20, max = 50) {
  const n = Number.parseInt(String(raw ?? fallback), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

function playlistPayloadMeta(playlist) {
  const items = Array.isArray(playlist?.items) ? playlist.items : [];
  return {
    title: String(playlist?.title || 'Untitled').slice(0, 200),
    description: playlist?.description ? String(playlist.description).slice(0, 1000) : null,
    translation: String(playlist?.translation || 'KJV').slice(0, 16),
    totalDuration: Number(playlist?.totalDuration) || 0,
    itemCount: items.length,
    json: JSON.stringify(playlist),
  };
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper functions
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

// ============ AUTH ENDPOINTS ============

// Sign Up
app.post('/auth/signup', requireDb, async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = generateId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password, display_name, created_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, email, hashedPassword, displayName || null, now, now);

    // Generate tokens
    const tokens = generateTokens(userId);

    const user = {
      id: userId,
      email,
      displayName: displayName || null,
      createdAt: now,
      lastLoginAt: now,
    };

    res.json({ user, tokens });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({ message: 'Sign up failed' });
  }
});

// Sign In
app.post('/auth/signin', requireDb, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, user.id);

    // Generate tokens
    const tokens = generateTokens(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
        lastLoginAt: now,
      },
      tokens,
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ message: 'Sign in failed' });
  }
});

// Sign Out
app.post('/auth/signout', requireDb, authenticateToken, (req, res) => {
  // In a production app, you'd invalidate the token here
  res.json({ message: 'Signed out successfully' });
});

// Verify Token
app.get('/auth/verify', requireDb, authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, display_name, created_at, last_login_at FROM users WHERE id = ?')
    .get(req.user.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    },
  });
});

// ============ PLAYLIST ENDPOINTS ============

// Get user playlists
app.get('/playlists', requireDb, authenticateToken, (req, res) => {
  try {
    const playlists = db.prepare('SELECT * FROM playlists WHERE user_id = ? ORDER BY updated_at DESC')
      .all(req.user.userId);

    const formatted = playlists.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      items: JSON.parse(p.items),
      translation: p.translation,
      totalDuration: p.total_duration,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      sourceType: p.source_type,
      promptUsed: p.prompt_used,
      tags: JSON.parse(p.tags),
      isFavorite: p.is_favorite === 1,
      isDownloaded: false,
      lastPlayedAt: p.last_played_at,
      completedCount: p.completed_count,
    }));

    res.json({ playlists: formatted });
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ message: 'Failed to get playlists' });
  }
});

// Sync playlist
app.post('/playlists/sync', requireDb, authenticateToken, (req, res) => {
  try {
    const { playlist } = req.body;

    // Check if playlist exists
    const existing = db.prepare('SELECT id FROM playlists WHERE id = ? AND user_id = ?')
      .get(playlist.id, req.user.userId);

    if (existing) {
      // Update
      db.prepare(`
        UPDATE playlists SET
          title = ?, description = ?, items = ?, translation = ?, total_duration = ?,
          updated_at = ?, source_type = ?, prompt_used = ?, tags = ?, is_favorite = ?,
          last_played_at = ?, completed_count = ?
        WHERE id = ? AND user_id = ?
      `).run(
        playlist.title,
        playlist.description || null,
        JSON.stringify(playlist.items),
        playlist.translation,
        playlist.totalDuration,
        playlist.updatedAt,
        playlist.sourceType,
        playlist.promptUsed || null,
        JSON.stringify(playlist.tags),
        playlist.isFavorite ? 1 : 0,
        playlist.lastPlayedAt || null,
        playlist.completedCount || 0,
        playlist.id,
        req.user.userId
      );
    } else {
      // Insert
      db.prepare(`
        INSERT INTO playlists (
          id, user_id, title, description, items, translation, total_duration,
          created_at, updated_at, source_type, prompt_used, tags, is_favorite,
          last_played_at, completed_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        playlist.id,
        req.user.userId,
        playlist.title,
        playlist.description || null,
        JSON.stringify(playlist.items),
        playlist.translation,
        playlist.totalDuration,
        playlist.createdAt,
        playlist.updatedAt,
        playlist.sourceType,
        playlist.promptUsed || null,
        JSON.stringify(playlist.tags),
        playlist.isFavorite ? 1 : 0,
        playlist.lastPlayedAt || null,
        playlist.completedCount || 0
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Sync playlist error:', error);
    res.status(500).json({ message: 'Failed to sync playlist' });
  }
});

// Delete playlist
app.delete('/playlists/:id', requireDb, authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM playlists WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ message: 'Failed to delete playlist' });
  }
});

// ============ ANALYTICS ENDPOINTS ============

// Track events
app.post('/analytics/events', requireDb, (req, res) => {
  try {
    const { events } = req.body;

    const insert = db.prepare(`
      INSERT INTO analytics_events (event_name, properties, timestamp, user_id, session_id, device_info)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((events) => {
      for (const event of events) {
        insert.run(
          event.eventName,
          JSON.stringify(event.properties || {}),
          event.timestamp,
          event.userId || null,
          event.sessionId || null,
          JSON.stringify(event.deviceInfo || {})
        );
      }
    });

    insertMany(events);

    res.json({ success: true });
  } catch (error) {
    console.error('Track events error:', error);
    res.status(500).json({ message: 'Failed to track events' });
  }
});

// Get analytics (for admin dashboard)
app.get('/analytics/summary', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    const activeToday = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM analytics_events
      WHERE DATE(timestamp) = DATE('now')
    `).get().count;

    const activeThisWeek = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM analytics_events
      WHERE DATE(timestamp) >= DATE('now', '-7 days')
    `).get().count;

    const activeThisMonth = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM analytics_events
      WHERE DATE(timestamp) >= DATE('now', '-30 days')
    `).get().count;

    const totalPlaylists = db.prepare('SELECT COUNT(*) as count FROM playlists').get().count;

    const featureUsage = db.prepare(`
      SELECT
        JSON_EXTRACT(properties, '$.feature') as feature,
        COUNT(*) as count
      FROM analytics_events
      WHERE event_name = 'feature_used'
      GROUP BY feature
      ORDER BY count DESC
      LIMIT 10
    `).all();

    const popularStations = db.prepare(`
      SELECT
        JSON_EXTRACT(properties, '$.station') as station,
        COUNT(*) as count
      FROM analytics_events
      WHERE event_name = 'station_used'
      GROUP BY station
      ORDER BY count DESC
      LIMIT 10
    `).all();

    const popularModes = db.prepare(`
      SELECT
        JSON_EXTRACT(properties, '$.mode') as mode,
        COUNT(*) as count
      FROM analytics_events
      WHERE event_name = 'mode_used'
      GROUP BY mode
      ORDER BY count DESC
    `).all();

    const avgSessionDuration = db.prepare(`
      SELECT AVG(JSON_EXTRACT(properties, '$.sessionDuration')) as avg
      FROM analytics_events
      WHERE event_name = 'app_closed' AND JSON_EXTRACT(properties, '$.sessionDuration') IS NOT NULL
    `).get().avg || 0;

    res.json({
      totalUsers,
      activeUsers: {
        today: activeToday,
        week: activeThisWeek,
        month: activeThisMonth,
      },
      totalPlaylists,
      featureUsage,
      popularStations,
      popularModes,
      avgSessionDuration: Math.round(avgSessionDuration),
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
});

// ============ AI / TTS (web + native clients) ============

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
}

app.get('/api/tts/health', (req, res) => {
  res.status(getOpenAIKey() ? 200 : 503).json({ ok: !!getOpenAIKey() });
});

app.post('/api/ai', async (req, res) => {
  try {
    const key = getOpenAIKey();
    if (!key) return res.status(503).json({ message: 'OpenAI key not configured' });

    const { messages, temperature, maxTokens, model } = req.body;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens || 2048,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json({ content: data.choices?.[0]?.message?.content || '' });
  } catch (error) {
    console.error('AI error:', error);
    res.status(500).json({ message: 'AI request failed' });
  }
});

app.post('/api/tts', async (req, res) => {
  try {
    const key = getOpenAIKey();
    if (!key) return res.status(503).send('OpenAI key not configured');

    const { text, voice, speed } = req.body;
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: voice || 'nova',
        input: text,
        speed: speed || 1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).send(err);
    }

    const buf = Buffer.from(await response.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.send(buf);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).send('TTS failed');
  }
});

// Alias analytics path used by web app
app.post('/api/analytics/events', requireDb, (req, res) => {
  try {
    const { events } = req.body;
    const insert = db.prepare(`
      INSERT INTO analytics_events (event_name, properties, timestamp, user_id, session_id, device_info)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((events) => {
      for (const event of events) {
        insert.run(
          event.eventName,
          JSON.stringify(event.properties || {}),
          event.timestamp,
          event.userId || null,
          event.sessionId || null,
          JSON.stringify(event.deviceInfo || {})
        );
      }
    });

    insertMany(events || []);
    res.json({ success: true });
  } catch (error) {
    console.error('Track events error:', error);
    res.status(500).json({ message: 'Failed to track events' });
  }
});

// ============ SOCIAL SHARE + COMMUNITY (JWT identity) ============

app.post('/social/share', requireDb, authenticateToken, (req, res) => {
  try {
    const { playlist } = req.body || {};
    if (!playlist || !playlist.title || !Array.isArray(playlist.items)) {
      return res.status(400).json({ message: 'Playlist with title and items required' });
    }
    if (playlist.items.length > 200) {
      return res.status(400).json({ message: 'Playlist is too large to share' });
    }

    const meta = playlistPayloadMeta(playlist);
    const now = new Date();
    const expires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    let code = generateShareCode();
    for (let attempt = 0; attempt < 8; attempt++) {
      const existing = db.prepare('SELECT code FROM shared_playlists WHERE code = ?').get(code);
      if (!existing) break;
      code = generateShareCode();
    }

    db.prepare(`
      INSERT INTO shared_playlists
        (code, user_id, playlist_json, title, description, translation, total_duration, item_count, created_at, expires_at, import_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      code,
      req.user.userId,
      meta.json,
      meta.title,
      meta.description,
      meta.translation,
      meta.totalDuration,
      meta.itemCount,
      now.toISOString(),
      expires.toISOString()
    );

    res.json({ code, expiresAt: expires.toISOString() });
  } catch (error) {
    console.error('Share create error:', error);
    res.status(500).json({ message: 'Failed to create share code' });
  }
});

app.get('/social/import/:code', requireDb, (req, res) => {
  try {
    const code = String(req.params.code || '').toUpperCase();
    const row = db.prepare('SELECT * FROM shared_playlists WHERE code = ?').get(code);
    if (!row) return res.status(404).json({ message: 'Share code not found' });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(410).json({ message: 'This share code has expired' });
    }
    db.prepare('UPDATE shared_playlists SET import_count = import_count + 1 WHERE code = ?').run(code);
    res.json({
      code: row.code,
      playlist: JSON.parse(row.playlist_json),
      expiresAt: row.expires_at,
      importCount: row.import_count + 1,
    });
  } catch (error) {
    console.error('Share import error:', error);
    res.status(500).json({ message: 'Failed to import share' });
  }
});

app.post('/social/community/submit', requireDb, authenticateToken, (req, res) => {
  try {
    const { playlist, displayName } = req.body || {};
    if (!playlist || !playlist.title || !Array.isArray(playlist.items)) {
      return res.status(400).json({ message: 'Playlist with title and items required' });
    }
    if (playlist.items.length > 200) {
      return res.status(400).json({ message: 'Playlist is too large to submit' });
    }

    const user = db.prepare('SELECT display_name, email FROM users WHERE id = ?').get(req.user.userId);
    const meta = playlistPayloadMeta(playlist);
    const id = generateId();
    const now = new Date().toISOString();
    const name =
      (displayName && String(displayName).slice(0, 80)) ||
      user?.display_name ||
      (user?.email ? user.email.split('@')[0] : 'Davar user');

    db.prepare(`
      INSERT INTO community_playlists
        (id, user_id, display_name, playlist_json, title, description, translation, total_duration, item_count, vote_count, import_count, is_featured, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
    `).run(
      id,
      req.user.userId,
      name,
      meta.json,
      meta.title,
      meta.description,
      meta.translation,
      meta.totalDuration,
      meta.itemCount,
      now
    );

    res.json({ id, title: meta.title, displayName: name, createdAt: now });
  } catch (error) {
    console.error('Community submit error:', error);
    res.status(500).json({ message: 'Failed to submit to community' });
  }
});

app.get('/social/community', requireDb, (req, res) => {
  try {
    const sort = String(req.query.sort || 'popular');
    const limit = clampLimit(req.query.limit, 20, 50);
    let orderBy = 'vote_count DESC, created_at DESC';
    if (sort === 'new') orderBy = 'created_at DESC';
    if (sort === 'featured') orderBy = 'is_featured DESC, vote_count DESC, created_at DESC';

    const rows = db.prepare(`
      SELECT id, user_id, display_name, title, description, translation, total_duration, item_count,
             vote_count, import_count, is_featured, created_at
      FROM community_playlists
      ORDER BY ${orderBy}
      LIMIT ?
    `).all(limit);

    res.json({
      playlists: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        displayName: r.display_name,
        title: r.title,
        description: r.description,
        translation: r.translation,
        totalDuration: r.total_duration,
        itemCount: r.item_count,
        voteCount: r.vote_count,
        importCount: r.import_count,
        isFeatured: r.is_featured === 1,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Community list error:', error);
    res.status(500).json({ message: 'Failed to list community playlists' });
  }
});

app.get('/social/community/:id', requireDb, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM community_playlists WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ message: 'Community playlist not found' });
    db.prepare('UPDATE community_playlists SET import_count = import_count + 1 WHERE id = ?').run(row.id);
    res.json({
      id: row.id,
      displayName: row.display_name,
      title: row.title,
      description: row.description,
      translation: row.translation,
      totalDuration: row.total_duration,
      itemCount: row.item_count,
      voteCount: row.vote_count,
      importCount: row.import_count + 1,
      isFeatured: row.is_featured === 1,
      createdAt: row.created_at,
      playlist: JSON.parse(row.playlist_json),
    });
  } catch (error) {
    console.error('Community detail error:', error);
    res.status(500).json({ message: 'Failed to load community playlist' });
  }
});

app.post('/social/community/:id/vote', requireDb, authenticateToken, (req, res) => {
  try {
    const playlistId = req.params.id;
    const exists = db.prepare('SELECT id FROM community_playlists WHERE id = ?').get(playlistId);
    if (!exists) return res.status(404).json({ message: 'Community playlist not found' });

    const vote = db.prepare('SELECT user_id FROM community_votes WHERE user_id = ? AND playlist_id = ?')
      .get(req.user.userId, playlistId);

    const apply = db.transaction(() => {
      if (vote) {
        db.prepare('DELETE FROM community_votes WHERE user_id = ? AND playlist_id = ?')
          .run(req.user.userId, playlistId);
        db.prepare('UPDATE community_playlists SET vote_count = CASE WHEN vote_count > 0 THEN vote_count - 1 ELSE 0 END WHERE id = ?')
          .run(playlistId);
        return { voted: false };
      }
      db.prepare('INSERT INTO community_votes (user_id, playlist_id, created_at) VALUES (?, ?, ?)')
        .run(req.user.userId, playlistId, new Date().toISOString());
      db.prepare('UPDATE community_playlists SET vote_count = vote_count + 1 WHERE id = ?').run(playlistId);
      return { voted: true };
    });

    const result = apply();
    const count = db.prepare('SELECT vote_count FROM community_playlists WHERE id = ?').get(playlistId);
    res.json({ voted: result.voted, voteCount: count?.vote_count || 0 });
  } catch (error) {
    console.error('Community vote error:', error);
    res.status(500).json({ message: 'Failed to vote' });
  }
});

// Serve web PWA build when present (API routes above take precedence)
const webDist = path.join(__dirname, '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/auth') ||
      req.path.startsWith('/playlists') ||
      req.path.startsWith('/analytics') ||
      req.path.startsWith('/api') ||
      req.path.startsWith('/social') ||
      req.path === '/health'
    ) {
      return next();
    }
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

// Explicit 405 for API paths hit with wrong method (avoids opaque proxy errors)
app.use((req, res, next) => {
  if (
    req.path.startsWith('/auth') ||
    req.path.startsWith('/playlists') ||
    req.path.startsWith('/analytics') ||
    req.path.startsWith('/api') ||
    req.path.startsWith('/social')
  ) {
    return res.status(405).json({ message: `Method ${req.method} not allowed for ${req.path}` });
  }
  next();
});

async function start() {
  const PORT = process.env.PORT || 3000;

  // Listen immediately so Railway healthchecks succeed while DB opens
  await new Promise((resolve, reject) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Davar backend listening on port ${PORT}`);
      resolve(server);
    });
    server.on('error', reject);
  });

  try {
    db = await openDatabase(dbPath);
    db.exec(SCHEMA_SQL);
    console.log(`Database ready: ${db.path}`);
  } catch (err) {
    console.error('Database failed to open:', err);
    // Keep process alive for health diagnostics; API routes return 503
  }
}

start().catch((err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});
