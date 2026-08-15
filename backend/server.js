const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
require('dotenv').config();

const app = express();
const db = new Database('scripture.db');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.exec(`
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
`);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
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
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

// ============ AUTH ENDPOINTS ============

// Sign Up
app.post('/auth/signup', async (req, res) => {
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
app.post('/auth/signin', async (req, res) => {
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
app.post('/auth/signout', authenticateToken, (req, res) => {
  // In a production app, you'd invalidate the token here
  res.json({ message: 'Signed out successfully' });
});

// Verify Token
app.get('/auth/verify', authenticateToken, (req, res) => {
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
app.get('/playlists', authenticateToken, (req, res) => {
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
app.post('/playlists/sync', authenticateToken, (req, res) => {
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
app.delete('/playlists/:id', authenticateToken, (req, res) => {
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
app.post('/analytics/events', (req, res) => {
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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
app.post('/api/analytics/events', (req, res) => {
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

// Serve web PWA build when present (no auth / no paid tiers)
const path = require('path');
const fs = require('fs');
const webDist = path.join(__dirname, '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/auth') || req.path.startsWith('/playlists') || req.path.startsWith('/analytics') || req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Scripture Backend running on port ${PORT}`);
});
