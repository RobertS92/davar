const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

/**
 * Async SQLite via sql.js (pure WASM — no native compile on Railway).
 * Exposes a small better-sqlite3-compatible surface used by server.js.
 */
async function openDatabase(dbPath) {
  const SQL = await initSqlJs();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

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

  // Flush on exit so the last writes land on the volume
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
    exec(sql) {
      // sql.js Database.exec runs multiple statements
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

function normalizeParams(params) {
  if (!params || params.length === 0) return [];
  // better-sqlite3 allows prepare().run(a, b) — sql.js wants an array
  return params.map((p) => (p === undefined ? null : p));
}

module.exports = { openDatabase };
