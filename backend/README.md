# Scripture App Backend

Complete backend API for the Scripture Playlist mobile app with user authentication, cloud sync, and analytics.

## Features

- ✅ User authentication (Sign up/Sign in/Sign out)
- ✅ JWT token-based auth
- ✅ Playlist cloud sync across devices
- ✅ Analytics tracking
- ✅ Admin dashboard
- ✅ SQLite database (easy to deploy)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Edit `.env`:
```
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### 3. Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Open Admin Dashboard

Open `admin.html` in your browser to see real-time analytics.

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/signin` - Login user
- `POST /auth/signout` - Logout user
- `GET /auth/verify` - Verify auth token

### Playlists (requires auth)
- `GET /playlists` - Get user's playlists
- `POST /playlists/sync` - Sync a playlist to cloud
- `DELETE /playlists/:id` - Delete a playlist

### Analytics
- `POST /analytics/events` - Track events (batch)
- `GET /analytics/summary` - Get analytics summary (for admin)

### Health
- `GET /health` - Health check

## Database

Uses SQLite (`scripture.db`) with these tables:
- `users` - User accounts
- `playlists` - User playlists
- `analytics_events` - All tracked events
- `sessions` - User sessions

## Deployment Options

### Option 1: Railway (Recommended - Free tier available)

1. Create account at [railway.app](https://railway.app)
2. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```
3. Deploy:
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```
4. Add environment variables in Railway dashboard
5. Get your app URL (e.g., `https://your-app.railway.app`)

### Option 2: Render.com (Free tier)

1. Create account at [render.com](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repo or upload code
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy

### Option 3: Heroku

```bash
cd backend
heroku create scripture-app-backend
heroku config:set JWT_SECRET=your-secret-key
git push heroku main
```

### Option 4: VPS (DigitalOcean, AWS, etc.)

1. SSH into your server
2. Install Node.js
3. Clone repo
4. Run `npm install`
5. Use PM2 to keep server running:
   ```bash
   npm install -g pm2
   pm2 start server.js --name scripture-backend
   pm2 save
   pm2 startup
   ```

## Connect Mobile App

After deploying, update your mobile app's `.env`:

```
EXPO_PUBLIC_API_URL=https://your-backend-url.com
```

Example:
```
EXPO_PUBLIC_API_URL=https://scripture-app.railway.app
```

## Security Notes

- Change `JWT_SECRET` in production
- Enable HTTPS in production
- Add rate limiting for auth endpoints
- Consider adding API key for analytics endpoint
- Regular database backups

## Monitoring

The admin dashboard (`admin.html`) shows:
- Total users
- Active users (today/week/month)
- Total playlists created
- Average session duration
- Most used features
- Popular stations
- Popular modes

## Database Backup

```bash
# Backup
cp scripture.db scripture_backup.db

# Restore
cp scripture_backup.db scripture.db
```

## Troubleshooting

**Port already in use:**
```bash
# Change PORT in .env or:
PORT=3001 npm start
```

**Database locked:**
```bash
# Stop all node processes
pkill node
# Restart server
npm start
```

**CORS errors:**
The server allows all origins in development. For production, update CORS settings in `server.js`.
