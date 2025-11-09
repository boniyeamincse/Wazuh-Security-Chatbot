# Administration Guide

This guide provides comprehensive information for administrators managing the Wazuh Security Chatbot in production environments.

## System Architecture

### Components Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Next.js App   │    │  Wazuh Manager  │
│                 │    │                 │    │                 │
│ • Chat UI       │◄──►│ • API Routes    │◄──►│ • REST API      │
│ • Quick Actions │    │ • Auth System   │    │ • Agents        │
│ • Dashboards    │    │ • RAG Engine    │    │ • Alerts        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   SQLite DB     │    │   LLM Service    │
                       │                 │    │                 │
                       │ • Audit Logs    │    │ • OpenAI API     │
                       │ • Chat History  │    │ • Ollama         │
                       │ • Sessions      │    │ • Streaming      │
                       └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **User Query** → Chat Interface → API Route
2. **Authentication** → JWT Verification → RBAC Check
3. **Query Processing** → LLM Service → Tool Execution
4. **Wazuh Integration** → API Calls → Data Retrieval
5. **Response Generation** → RAG Enhancement → User Response
6. **Audit Logging** → Database → Compliance Records

## Configuration Management

### Environment Variables

#### Required Variables

```env
# Wazuh Configuration
WAZUH_API_BASE_URL=https://wazuh-manager.company.com:55000
WAZUH_API_USER=chatbot_service
WAZUH_API_PASS=strong_password_here

# AI Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...

# Security
SESSION_SECRET=32_character_random_string_here

# Database
DATABASE_URL=file:/var/lib/wazuh-chatbot/database.db
```

#### Optional Variables

```env
# Performance Tuning
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT_MS=30000

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/wazuh-chatbot/app.log

# Cache Settings
CACHE_TTL_SECONDS=300
MAX_CACHE_SIZE_MB=100

# Feature Flags
ENABLE_AUDIT_LOGGING=true
ENABLE_CHAT_HISTORY=true
ENABLE_RAG=true
```

### Configuration Files

#### Next.js Configuration (`next.config.ts`)

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

#### Docker Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  wazuh-chatbot:
    image: wazuh-chatbot:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/database.db
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
```

## Security Administration

### Authentication & Authorization

#### User Management

```typescript
// lib/auth.ts - User creation example
export function createUser(username: string, role: 'admin' | 'analyst' | 'viewer'): User {
  return {
    id: username,
    role,
    permissions: ROLE_PERMISSIONS[role],
  };
}
```

#### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **admin** | Full access to all features and settings |
| **analyst** | Read alerts, agents, vulnerabilities; write reports |
| **viewer** | Read-only access to dashboards and reports |

#### Session Management

```typescript
// Session configuration
const SESSION_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict' as const,
};
```

### Audit Logging

#### Audit Events

The system logs the following events:

- User authentication attempts
- API calls to Wazuh
- Chat queries and responses
- Dashboard access
- Configuration changes
- System errors

#### Audit Log Queries

```sql
-- Recent authentication attempts
SELECT * FROM audit_logs
WHERE action = 'login_attempt'
ORDER BY timestamp DESC
LIMIT 100;

-- API usage by user
SELECT user_id, action, COUNT(*) as count
FROM audit_logs
WHERE timestamp > datetime('now', '-30 days')
GROUP BY user_id, action
ORDER BY count DESC;

-- Failed operations
SELECT * FROM audit_logs
WHERE details LIKE '%error%'
ORDER BY timestamp DESC
LIMIT 50;
```

#### Log Retention Policy

```typescript
// Automatic cleanup
export function cleanupOldLogs(daysToKeep: number = 90): void {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM audit_logs WHERE timestamp < ?');
  stmt.run(cutoffDate.getTime());
}
```

## Performance Tuning

### Database Optimization

#### SQLite Configuration

```sql
-- Performance optimizations
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 1000000;
PRAGMA temp_store = memory;
PRAGMA mmap_size = 268435456;
```

#### Connection Pooling

```typescript
// Database connection management
const db = getDatabase();
db.pragma('busy_timeout = 30000');
db.pragma('foreign_keys = ON');
```

### Caching Strategies

#### Response Caching

```typescript
// Cache Wazuh API responses
const cache = new Map();

export function getCachedResponse(key: string, ttlMs: number = 300000): any {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data;
  }
  return null;
}

export function setCachedResponse(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}
```

#### Query Optimization

```typescript
// Prepared statements for frequently used queries
const getAlertsBySeverityStmt = db.prepare(`
  SELECT * FROM alerts
  WHERE severity >= ?
  AND timestamp > ?
  ORDER BY timestamp DESC
  LIMIT ?
`);
```

## Monitoring & Alerting

### Health Checks

#### Application Health

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connectivity
    const db = getDatabase();
    db.prepare('SELECT 1').get();

    // Check Wazuh connectivity
    const client = getWazuhClient();
    await client.getAgents({ limit: 1 });

    // Check LLM service
    if (process.env.LLM_PROVIDER === 'openai') {
      // Test OpenAI connectivity
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

#### Metrics Collection

```typescript
// Prometheus metrics
const metrics = {
  httpRequestsTotal: new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  }),

  responseTime: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration',
    labelNames: ['method', 'route'],
  }),

  activeConnections: new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
  }),
};
```

### Alert Configuration

#### System Alerts

```typescript
// Alert thresholds
const ALERT_THRESHOLDS = {
  maxResponseTime: 5000, // ms
  maxErrorRate: 0.05, // 5%
  minDiskSpace: 1024 * 1024 * 1024, // 1GB
  maxMemoryUsage: 512 * 1024 * 1024, // 512MB
};

// Alert checking function
export function checkSystemHealth(): Alert[] {
  const alerts: Alert[] = [];

  // Check response times
  if (avgResponseTime > ALERT_THRESHOLDS.maxResponseTime) {
    alerts.push({
      level: 'warning',
      message: `High response time: ${avgResponseTime}ms`,
    });
  }

  // Check error rates
  if (errorRate > ALERT_THRESHOLDS.maxErrorRate) {
    alerts.push({
      level: 'error',
      message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
    });
  }

  return alerts;
}
```

## Backup & Recovery

### Database Backup

#### Automated Backups

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/wazuh-chatbot"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/var/lib/wazuh-chatbot/database.db"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/backup_$DATE.db'"

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.db"

# Clean old backups (keep last 30 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.db.gz"
```

#### Backup Verification

```bash
# Verify backup integrity
sqlite3 backup.db "PRAGMA integrity_check;"

# Check backup size
ls -lh backup.db.gz

# Test restore
gunzip backup.db.gz
sqlite3 backup.db ".schema" > schema.sql
```

### Disaster Recovery

#### Recovery Procedure

1. **Stop the application**
   ```bash
   docker-compose down
   ```

2. **Restore database**
   ```bash
   cp backup.db /var/lib/wazuh-chatbot/database.db
   chown nodejs:nodejs /var/lib/wazuh-chatbot/database.db
   ```

3. **Verify data integrity**
   ```bash
   sqlite3 /var/lib/wazuh-chatbot/database.db "PRAGMA integrity_check;"
   ```

4. **Restart application**
   ```bash
   docker-compose up -d
   ```

5. **Verify functionality**
   - Check health endpoint
   - Test basic queries
   - Verify audit logs

## Troubleshooting

### Common Issues

#### High Memory Usage

**Symptoms:**
- Application slowdown
- Out of memory errors
- Database connection issues

**Solutions:**
```typescript
// Memory monitoring
const memUsage = process.memoryUsage();
if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
  console.warn('High memory usage detected');
  // Force garbage collection if available
  if (global.gc) global.gc();
}
```

#### Database Locks

**Symptoms:**
- Timeout errors
- Slow queries
- Connection pool exhausted

**Solutions:**
```sql
-- Check for locks
SELECT * FROM sqlite_master WHERE type='table';
PRAGMA lock_status;

-- Optimize database
VACUUM;
REINDEX;
```

#### API Rate Limits

**Symptoms:**
- 429 errors from LLM providers
- Slow responses
- Service degradation

**Solutions:**
```typescript
// Rate limiting
const rateLimiter = new Map();

export function checkRateLimit(userId: string, maxRequests: number = 60): boolean {
  const key = `${userId}:${Math.floor(Date.now() / 60000)}`; // Per minute
  const current = rateLimiter.get(key) || 0;

  if (current >= maxRequests) {
    return false;
  }

  rateLimiter.set(key, current + 1);
  return true;
}
```

## Scaling Considerations

### Horizontal Scaling

#### Load Balancer Configuration

```nginx
upstream chatbot_backend {
    server chatbot1:3000;
    server chatbot2:3000;
    server chatbot3:3000;
}

server {
    listen 80;
    server_name chatbot.company.com;

    location / {
        proxy_pass http://chatbot_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Session Store

For multiple instances, use Redis for session storage:

```typescript
// Redis session store
import { Redis } from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

export async function getSession(sessionId: string): Promise<Session | null> {
  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function setSession(sessionId: string, session: Session): Promise<void> {
  await redis.setex(
    `session:${sessionId}`,
    Math.floor((session.expiresAt - Date.now()) / 1000),
    JSON.stringify(session)
  );
}
```

### Database Scaling

#### Read Replicas

```typescript
// Read replica configuration
const readDb = new Database('./database-read.db');
const writeDb = new Database('./database-write.db');

export function getReadDb(): Database.Database {
  return readDb;
}

export function getWriteDb(): Database.Database {
  return writeDb;
}
```

## Compliance & Governance

### Data Retention

#### Audit Log Retention

```typescript
// Automated cleanup
export async function cleanupAuditLogs(): Promise<void> {
  const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || '365');

  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM audit_logs
    WHERE timestamp < ?
  `);

  const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  stmt.run(cutoffDate);

  console.log(`Cleaned up audit logs older than ${retentionDays} days`);
}
```

#### Chat History Retention

```typescript
// Chat history cleanup
export async function cleanupChatHistory(): Promise<void> {
  const retentionDays = parseInt(process.env.CHAT_RETENTION_DAYS || '90');

  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM chat_history
    WHERE timestamp < ?
  `);

  const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  stmt.run(cutoffDate);
}
```

### Access Controls

#### IP Whitelisting

```typescript
// IP-based access control
const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',') || [];

export function checkIPAccess(ip: string): boolean {
  if (ALLOWED_IPS.length === 0) return true;
  return ALLOWED_IPS.includes(ip);
}
```

#### Geographic Restrictions

```typescript
// Geographic access control
const ALLOWED_COUNTRIES = process.env.ALLOWED_COUNTRIES?.split(',') || [];

export async function checkGeoAccess(ip: string): Promise<boolean> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return ALLOWED_COUNTRIES.includes(data.countryCode);
  } catch (error) {
    console.error('Geo-check failed:', error);
    return false; // Fail-safe: deny access
  }
}
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly Tasks
- [ ] Review error logs
- [ ] Check disk usage
- [ ] Verify backup integrity
- [ ] Update dependencies

#### Monthly Tasks
- [ ] Security patch updates
- [ ] Performance optimization
- [ ] Database maintenance (VACUUM, REINDEX)
- [ ] Review access logs

#### Quarterly Tasks
- [ ] Full security audit
- [ ] Disaster recovery testing
- [ ] Compliance review
- [ ] Documentation updates

### Emergency Procedures

#### Service Outage Response

1. **Assess the situation**
   - Check system resources
   - Review error logs
   - Verify network connectivity

2. **Implement temporary fixes**
   - Restart services
   - Clear caches
   - Scale resources if needed

3. **Communicate with stakeholders**
   - Update status page
   - Notify affected users
   - Provide ETA for resolution

4. **Post-mortem analysis**
   - Document root cause
   - Implement preventive measures
   - Update runbooks

This administration guide should be reviewed and updated regularly to reflect changes in the system and emerging best practices.