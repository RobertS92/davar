const fs = require('fs');
const path = require('path');
// Pure JS build — no separate .wasm file to locate (more reliable on Railway)
const initSqlJs = require('sql.js/dist/sql-asm.js');

/**
 * Async SQLite via sql.js (pure JS — no native compile, no wasm file).
 * Exposes a small better-sqlite3-compatible surface used by server.js.
 */
async function openDatabase(preferredPath) {
  const SQL = await initSqlJs();
  const dbPath = resolveWritableDbPath(preferredPath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  let raw = null;
  if (fs.existsSync(dbPath)) {
    raw = fs.readFileSync(dbPath);
  }
  const db = raw ? new SQL.Database(raw) : new SQL.Database();

  let saveTimer = null;
  const saveNow = () => {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  };
  const scheduleSave = () => {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        saveNow();
      } catch (err) {
        console.error('Failed to persist database:', err);
      }
    }, 50);
  };

  const flush = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    try {
      saveNow();
    } catch {
      // ignore
    }
  };
  process.on('exit', flush);
  process.on('SIGINT', () => {
    flush();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    flush();
    process.exit(0);
  });

  return {
    path: dbPath,
    exec(sql) {
      db.exec(sql);
      scheduleSave();
    },

    prepare(sql) {
      return {
        run(...params) {
          db.run(sql, normalizeParams(params));
          scheduleSave();
          return { changes: db.getRowsModified() };
        },
        get(...params) {
          const stmt = db.prepare(sql);
          try {
            stmt.bind(normalizeParams(params));
            if (stmt.step()) {
              return stmt.getAsObject();
            }
            return undefined;
          } finally {
            stmt.free();
          }
        },
        all(...params) {
          const stmt = db.prepare(sql);
          try {
            stmt.bind(normalizeParams(params));
            const rows = [];
            while (stmt.step()) {
              rows.push(stmt.getAsObject());
            }
            return rows;
          } finally {
            stmt.free();
          }
        },
      };
    },

    transaction(fn) {
      return (arg) => {
        db.run('BEGIN');
        try {
          fn(arg);
          db.run('COMMIT');
          scheduleSave();
        } catch (err) {
          try {
            db.run('ROLLBACK');
          } catch {
            // ignore
          }
          throw err;
        }
      };
    },

    flush,
  };
}

/** Prefer configured path; fall back if not writable (missing Railway volume). */
function resolveWritableDbPath(preferredPath) {
  const candidates = [
    preferredPath,
    path.join(__dirname, 'data', 'scripture.db'),
    path.join('/tmp', 'davar-scripture.db'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const dir = path.dirname(candidate);
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      const probe = path.join(dir, `.write-test-${process.pid}`);
      fs.writeFileSync(probe, 'ok');
      fs.unlinkSync(probe);
      if (candidate !== preferredPath) {
        console.warn(`DATABASE_PATH "${preferredPath}" not writable; using "${candidate}"`);
      }
      return candidate;
    } catch (err) {
      console.warn(`Skipping db path "${candidate}": ${err.message}`);
    }
  }

  throw new Error(`No writable database path. Tried: ${candidates.join(', ')}`);
}

function normalizeParams(params) {
  if (!params || params.length === 0) return [];
  return params.map((p) => (p === undefined ? null : p));
}

module.exports = { openDatabase };
