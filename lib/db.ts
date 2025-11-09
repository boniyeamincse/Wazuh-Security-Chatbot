import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'sqlite.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');

    // Create audit log table
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
    `);

    // Create sessions table for session management
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        data TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    `);

    // Create chat history table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        user_message TEXT NOT NULL,
        assistant_message TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_history(session_id);
      CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_history(timestamp);
    `);
  }

  return db;
}

// Prepared statements for better performance
const insertAuditLogStmt = (db: Database.Database) => db.prepare(`
  INSERT INTO audit_logs (timestamp, user_id, action, resource, details, ip_address)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const getAuditLogsStmt = (db: Database.Database) => db.prepare(`
  SELECT * FROM audit_logs
  ORDER BY timestamp DESC
  LIMIT ?
`);

const insertSessionStmt = (db: Database.Database) => db.prepare(`
  INSERT OR REPLACE INTO sessions (id, user_id, data, expires_at)
  VALUES (?, ?, ?, ?)
`);

const getSessionStmt = (db: Database.Database) => db.prepare(`
  SELECT * FROM sessions WHERE id = ? AND expires_at > ?
`);

const deleteExpiredSessionsStmt = (db: Database.Database) => db.prepare(`
  DELETE FROM sessions WHERE expires_at <= ?
`);

const insertChatHistoryStmt = (db: Database.Database) => db.prepare(`
  INSERT INTO chat_history (session_id, user_message, assistant_message, timestamp)
  VALUES (?, ?, ?, ?)
`);

const getChatHistoryStmt = (db: Database.Database) => db.prepare(`
  SELECT * FROM chat_history
  WHERE session_id = ?
  ORDER BY timestamp DESC
  LIMIT ?
`);

// Audit logging functions
export function insertAuditLog(entry: {
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
}): void {
  const db = getDatabase();
  const stmt = insertAuditLogStmt(db);

  stmt.run(
    entry.timestamp,
    entry.userId,
    entry.action,
    entry.resource,
    entry.details ? JSON.stringify(entry.details) : null,
    entry.ipAddress || null
  );
}

export function getAuditLogs(limit: number = 100): any[] {
  const db = getDatabase();
  const stmt = getAuditLogsStmt(db);
  return stmt.all(limit);
}

// Session management functions
export function insertSession(session: {
  id: string;
  userId: string;
  data: string;
  expiresAt: number;
}): void {
  const db = getDatabase();
  const stmt = insertSessionStmt(db);
  stmt.run(session.id, session.userId, session.data, session.expiresAt);
}

export function getSession(sessionId: string): any | null {
  const db = getDatabase();
  const stmt = getSessionStmt(db);
  return stmt.get(sessionId, Date.now());
}

export function deleteExpiredSessions(): void {
  const db = getDatabase();
  const stmt = deleteExpiredSessionsStmt(db);
  stmt.run(Date.now());
}

// Chat history functions
export function insertChatHistory(entry: {
  sessionId?: string;
  userMessage: string;
  assistantMessage: string;
  timestamp: number;
}): void {
  const db = getDatabase();
  const stmt = insertChatHistoryStmt(db);
  stmt.run(entry.sessionId, entry.userMessage, entry.assistantMessage, entry.timestamp);
}

export function getChatHistory(sessionId: string, limit: number = 50): any[] {
  const db = getDatabase();
  const stmt = getChatHistoryStmt(db);
  return stmt.all(sessionId, limit);
}

// Cleanup function
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Graceful shutdown
process.on('exit', closeDatabase);
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);