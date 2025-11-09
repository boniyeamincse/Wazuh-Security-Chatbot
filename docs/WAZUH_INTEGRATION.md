# Wazuh Integration Guide

This guide provides detailed information about integrating the Wazuh Security Chatbot with Wazuh SIEM systems, including API configuration, data mapping, and troubleshooting.

## Wazuh Architecture Overview

### Wazuh Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Wazuh Agents  │    │ Wazuh Manager   │    │   Wazuh API     │
│                 │    │                 │    │                 │
│ • Log Collection│◄──►│ • Analysis      │◄──►│ • RESTful API   │
│ • File Integrity│    │ • Correlation   │    │ • Authentication│
│ • Rootkit Det.  │    │ • Alerting      │    │ • Data Access   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Log Sources   │    │   Databases     │    │   Chatbot       │
│                 │    │                 │    │                 │
│ • Syslog        │    │ • Alerts DB     │    │ • Query Engine  │
│ • Windows Event │    │ • Agents DB     │    │ • AI Analysis   │
│ • Cloud Logs    │    │ • Vulnerabilities│    │ • Dashboards    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Configuration

### Enabling Wazuh REST API

#### Method 1: Using Wazuh Installation Script

```bash
# Enable API during installation
curl -so ~/wazuh-install.sh https://packages.wazuh.com/4.4/wazuh-install.sh
sudo bash ~/wazuh-install.sh -a
```

#### Method 2: Manual Configuration

1. **Install Wazuh Manager**:
   ```bash
   # Ubuntu/Debian
   wget -qO - https://packages.wazuh.com/key/GPG-KEY-WAZUH | apt-key add -
   echo "deb https://packages.wazuh.com/4.4/xUbuntu/20.04/ /" | tee /etc/apt/sources.list.d/wazuh.list
   apt-get update
   apt-get install wazuh-manager

   # CentOS/RHEL
   cat > /etc/yum.repos.d/wazuh.repo << EOF
   [wazuh]
   gpgcheck=1
   gpgkey=https://packages.wazuh.com/key/GPG-KEY-WAZUH
   enabled=1
   name=EL-\$releasever - Wazuh
   baseurl=https://packages.wazuh.com/4.4/yum/
   protect=1
   EOF
   yum install wazuh-manager
   ```

2. **Configure ossec.conf**:
   ```xml
   <ossec_config>
       <!-- Previous configuration -->

       <!-- Enable RESTful API -->
       <remote>
           <connection>secure</connection>
           <port>55000</port>
           <protocol>tcp</protocol>
           <queue_size>16384</queue_size>
       </remote>

       <!-- API configuration -->
       <ossec_config>
           <api>
               <host>0.0.0.0</host>
               <port>55000</port>
               <ssl>
                   <enabled>yes</enabled>
                   <key>/var/ossec/etc/sslmanager.key</key>
                   <cert>/var/ossec/etc/sslmanager.cert</cert>
                   <ca_cert>/var/ossec/etc/sslmanager.ca</ca_cert>
               </ssl>
           </api>
       </ossec_config>
   </ossec_config>
   ```

3. **Generate SSL Certificates**:
   ```bash
   # Create certificate directory
   mkdir -p /var/ossec/etc/ssl

   # Generate self-signed certificate
   openssl req -x509 -newkey rsa:4096 \
     -keyout /var/ossec/etc/sslmanager.key \
     -out /var/ossec/etc/sslmanager.cert \
     -days 365 -nodes \
     -subj "/C=US/ST=State/L=City/O=Organization/CN=wazuh-manager"

   # Set permissions
   chown ossec:ossec /var/ossec/etc/sslmanager.*
   chmod 600 /var/ossec/etc/sslmanager.key
   chmod 644 /var/ossec/etc/sslmanager.cert
   ```

4. **Create API User**:
   ```bash
   # Start Wazuh manager
   systemctl start wazuh-manager

   # Create user (interactive)
   /var/ossec/framework/python/bin/python3 -c "
   from wazuh.core.cluster.dapi.dapi import DistributedAPI
   from wazuh.core.configuration import read_yaml_config
   import getpass

   # This requires manual intervention - see Wazuh docs
   print('Use Wazuh API user creation documentation')
   "
   ```

### Alternative: Using Wazuh Docker

```yaml
# docker-compose.wazuh.yml
version: '3.8'
services:
  wazuh:
    image: wazuh/wazuh-manager:4.4.0
    hostname: wazuh-manager
    ports:
      - "1514:1514"
      - "1515:1515"
      - "55000:55000"
    environment:
      - WAZUH_MANAGER_IP=127.0.0.1
    volumes:
      - wazuh_data:/var/ossec/data
      - wazuh_logs:/var/ossec/logs
      - ./ssl:/var/ossec/etc/ssl
    networks:
      - wazuh

volumes:
  wazuh_data:
  wazuh_logs:

networks:
  wazuh:
    driver: bridge
```

## Chatbot Configuration

### Environment Variables

```env
# Wazuh API Configuration
WAZUH_API_BASE_URL=https://wazuh-manager.company.com:55000
WAZUH_API_USER=chatbot_service
WAZUH_API_PASS=strong_password_here

# Connection Settings
WAZUH_REQUEST_TIMEOUT=30000
WAZUH_MAX_RETRIES=3
WAZUH_RETRY_DELAY=1000

# Data Limits
WAZUH_MAX_ALERTS_PER_REQUEST=1000
WAZUH_MAX_AGENTS_PER_REQUEST=500
WAZUH_DEFAULT_TIME_RANGE=24h
```

### Connection Testing

```bash
# Test basic connectivity
curl -k -u username:password https://wazuh-manager:55000/

# Test alerts endpoint
curl -k -u username:password \
  "https://wazuh-manager:55000/events/alerts?limit=1"

# Test agents endpoint
curl -k -u username:password \
  "https://wazuh-manager:55000/agents?limit=1"
```

## Data Mapping

### Alert Data Structure

#### Wazuh Alert Format
```json
{
  "id": "alert_id",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "rule": {
    "level": 12,
    "description": "Alert description",
    "id": "1001",
    "groups": ["authentication", "syslog"]
  },
  "agent": {
    "id": "001",
    "name": "web-server-01",
    "ip": "192.168.1.10"
  },
  "location": "/var/log/auth.log",
  "decoder": {
    "name": "sshd"
  },
  "data": {
    "srcip": "10.0.0.1",
    "dstuser": "admin"
  },
  "full_log": "Jan 1 12:00:00 web-server sshd[1234]: Failed password for admin from 10.0.0.1"
}
```

#### Chatbot Alert Mapping
```typescript
interface Alert {
  id: string;
  timestamp: string;
  rule: {
    level: number;
    description: string;
    id: string;
  };
  agent: {
    id: string;
    name: string;
  };
  location: string;
  full_log: string;
}
```

### Agent Data Structure

#### Wazuh Agent Format
```json
{
  "id": "001",
  "name": "web-server-01",
  "ip": "192.168.1.10",
  "status": "active",
  "os": {
    "name": "Ubuntu",
    "version": "20.04",
    "major": "20",
    "minor": "04",
    "uname": "Linux web-server-01 5.4.0-42-generic #46-Ubuntu SMP Fri Jul 10 00:24:02 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux",
    "platform": "ubuntu",
    "arch": "x86_64"
  },
  "version": "Wazuh v4.4.0",
  "lastKeepAlive": "2024-01-01T12:00:00.000Z",
  "dateAdd": "2024-01-01T10:00:00.000Z",
  "group": ["web-servers", "linux"],
  "mergedSum": "abcd1234",
  "configSum": "efgh5678"
}
```

#### Chatbot Agent Mapping
```typescript
interface Agent {
  id: string;
  name: string;
  ip: string;
  status: 'active' | 'disconnected' | 'never_connected';
  lastKeepAlive: string;
  os: {
    name: string;
    version: string;
  };
}
```

### Vulnerability Data Structure

#### Wazuh Vulnerability Format
```json
{
  "cve": "CVE-2021-44228",
  "title": "Apache Log4j2 Remote Code Execution",
  "severity": "Critical",
  "package": {
    "name": "liblog4j2-java",
    "version": "2.14.1-1ubuntu1",
    "architecture": "all"
  },
  "cvss": {
    "cvss2": {
      "score": 10.0,
      "vector": "AV:N/AC:L/Au:N/C:C/I:C/A:C"
    },
    "cvss3": {
      "score": 10.0,
      "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H"
    }
  },
  "condition": "Package unfixed",
  "reference": "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-44228",
  "type": "PACKAGE"
}
```

#### Chatbot Vulnerability Mapping
```typescript
interface Vulnerability {
  cve: string;
  title: string;
  severity: string;
  package: string;
  agent: {
    id: string;
    name: string;
  };
}
```

## API Endpoints Integration

### Alerts API

#### Available Endpoints
- `GET /events/alerts` - Retrieve security alerts
- `GET /events/alerts/{alert_id}` - Get specific alert
- `GET /events/alerts/summary` - Alert summary statistics

#### Query Parameters
```typescript
interface AlertQueryParams {
  limit?: number;      // Max results (default: 500)
  offset?: number;     // Pagination offset
  sort?: string;       // Sort field and order
  search?: string;     // Text search
  time?: string;       // Time range (e.g., "1h", "24h", "7d")
  level?: string;      // Minimum severity level
  rule_id?: string;    // Filter by rule ID
  agent_id?: string;   // Filter by agent ID
  location?: string;   // Filter by log location
  group?: string;      // Filter by rule group
}
```

#### Example Queries
```typescript
// Critical alerts from last hour
const params = {
  level: '12',
  time: '1h',
  limit: 100
};

// Authentication failures
const params = {
  search: 'authentication failure',
  time: '24h',
  limit: 50
};
```

### Agents API

#### Available Endpoints
- `GET /agents` - List all agents
- `GET /agents/{agent_id}` - Get specific agent
- `GET /agents/summary` - Agent summary statistics
- `GET /agents/{agent_id}/stats` - Agent statistics

#### Query Parameters
```typescript
interface AgentQueryParams {
  limit?: number;      // Max results (default: 500)
  offset?: number;     // Pagination offset
  sort?: string;       // Sort field and order
  search?: string;     // Text search
  status?: string;     // Agent status filter
  os?: string;         // OS filter
  version?: string;    // Version filter
  group?: string;      // Group filter
  ip?: string;         // IP address filter
}
```

### Vulnerabilities API

#### Available Endpoints
- `GET /vulnerability` - List vulnerabilities
- `GET /vulnerability/{agent_id}` - Agent vulnerabilities
- `GET /vulnerability/summary` - Vulnerability summary

#### Query Parameters
```typescript
interface VulnerabilityQueryParams {
  limit?: number;      // Max results (default: 100)
  offset?: number;     // Pagination offset
  agent_id?: string;   // Filter by agent
  cve?: string;        // Filter by CVE ID
  severity?: string;   // Severity filter
  package?: string;    // Package name filter
}
```

## Integration Patterns

### Synchronous Queries

```typescript
// Direct API call
export async function getCriticalAlerts(): Promise<QueryResult> {
  try {
    const client = getWazuhClient();
    const result = await client.getAlerts({
      level: '12',
      time: '1h',
      limit: 50,
    });

    return {
      data: result.data?.alerts || [],
      summary: `Found ${result.data?.total || 0} critical alerts`,
      insights: generateInsights(result.data?.alerts || []),
    };
  } catch (error) {
    console.error('Wazuh API error:', error);
    throw new Error('Failed to fetch critical alerts');
  }
}
```

### Batch Processing

```typescript
// Process large datasets in batches
export async function getAllAgents(): Promise<Agent[]> {
  const allAgents: Agent[] = [];
  let offset = 0;
  const batchSize = 500;

  while (true) {
    const result = await client.getAgents({
      limit: batchSize,
      offset,
    });

    const agents = result.data?.agents || [];
    allAgents.push(...agents);

    if (agents.length < batchSize) break;
    offset += batchSize;
  }

  return allAgents;
}
```

### Real-time Monitoring

```typescript
// WebSocket connection for real-time alerts
export class WazuhMonitor {
  private ws: WebSocket | null = null;

  connect(): void {
    this.ws = new WebSocket('wss://wazuh-manager:55000/events');

    this.ws.onmessage = (event) => {
      const alert = JSON.parse(event.data);
      this.handleNewAlert(alert);
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(), 5000); // Reconnect after 5s
    };
  }

  private handleNewAlert(alert: any): void {
    // Process real-time alert
    console.log('New alert:', alert);
    // Update dashboard, send notifications, etc.
  }
}
```

## Error Handling

### Common Error Codes

| HTTP Status | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

### Error Handling Patterns

```typescript
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (attempt === retries) throw error;

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      console.warn(`API call failed (attempt ${attempt}/${retries}):`, error.message);
    }
  }

  throw new Error('All retry attempts failed');
}
```

### Circuit Breaker Pattern

```typescript
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 60000) { // 1 minute timeout
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= 5) { // 5 failures trigger open state
      this.state = 'open';
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }
}
```

## Performance Optimization

### Query Optimization

#### Efficient Filtering

```typescript
// Use specific filters to reduce data transfer
const optimizedQuery = {
  level: '8',        // Only high severity and above
  time: '1h',        // Recent alerts only
  limit: 100,        // Reasonable page size
  sort: '-timestamp', // Most recent first
};
```

#### Pagination Strategy

```typescript
// Implement cursor-based pagination for large datasets
export async function getAlertsPaginated(cursor?: string, pageSize: number = 50) {
  const params: any = { limit: pageSize };

  if (cursor) {
    params.offset = parseInt(cursor);
  }

  const result = await client.getAlerts(params);

  return {
    data: result.data?.alerts || [],
    nextCursor: result.data?.alerts?.length === pageSize
      ? (parseInt(cursor || '0') + pageSize).toString()
      : null,
    hasMore: result.data?.alerts?.length === pageSize,
  };
}
```

### Caching Strategies

#### Response Caching

```typescript
const alertCache = new Map();

export async function getCachedAlerts(params: AlertQueryParams): Promise<Alert[]> {
  const cacheKey = JSON.stringify(params);
  const cached = alertCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
    return cached.data;
  }

  const result = await client.getAlerts(params);
  const alerts = result.data?.alerts || [];

  alertCache.set(cacheKey, {
    data: alerts,
    timestamp: Date.now(),
  });

  return alerts;
}
```

#### Background Refresh

```typescript
// Refresh cache in background
setInterval(async () => {
  try {
    const freshAlerts = await client.getAlerts({ limit: 100, time: '1h' });
    alertCache.set('recent_alerts', {
      data: freshAlerts.data?.alerts || [],
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Background cache refresh failed:', error);
  }
}, 60000); // Every minute
```

## Monitoring Integration

### Health Checks

```typescript
// Wazuh-specific health checks
export async function checkWazuhHealth(): Promise<HealthStatus> {
  const checks = {
    apiConnectivity: false,
    databaseAccess: false,
    agentCommunication: false,
  };

  try {
    // Test API connectivity
    await client.getAgents({ limit: 1 });
    checks.apiConnectivity = true;

    // Test agent communication (check recent keepalives)
    const agents = await client.getAgents({ status: 'active', limit: 5 });
    checks.agentCommunication = agents.data?.agents?.length > 0;

    // Database access is implicit in API calls
    checks.databaseAccess = true;

  } catch (error) {
    console.error('Health check failed:', error);
  }

  return {
    status: Object.values(checks).every(Boolean) ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  };
}
```

### Metrics Collection

```typescript
// Custom metrics for Wazuh integration
const metrics = {
  wazuhApiCalls: new Counter({
    name: 'wazuh_api_calls_total',
    help: 'Total Wazuh API calls',
    labelNames: ['endpoint', 'status'],
  }),

  wazuhApiLatency: new Histogram({
    name: 'wazuh_api_call_duration_seconds',
    help: 'Wazuh API call duration',
    labelNames: ['endpoint'],
  }),

  wazuhAlertsProcessed: new Counter({
    name: 'wazuh_alerts_processed_total',
    help: 'Total alerts processed',
    labelNames: ['severity'],
  }),
};
```

## Security Considerations

### API Authentication

#### Token-based Authentication

```typescript
// Use API tokens instead of username/password
export class WazuhTokenClient {
  private token: string;
  private tokenExpiry: number;

  async authenticate(): Promise<void> {
    const response = await fetch(`${baseUrl}/security/user/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.WAZUH_API_USER,
        password: process.env.WAZUH_API_PASS,
      }),
    });

    const data = await response.json();
    this.token = data.data.token;
    this.tokenExpiry = Date.now() + (data.data.expires_in * 1000);
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (Date.now() > this.tokenExpiry) {
      await this.authenticate();
    }

    return fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`,
      },
    });
  }
}
```

### Network Security

#### Firewall Configuration

```bash
# Allow chatbot server to access Wazuh API
sudo ufw allow from chatbot-server-ip to any port 55000 proto tcp

# Restrict API access to known IPs
sudo iptables -A INPUT -p tcp -s chatbot-server-ip --dport 55000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 55000 -j DROP
```

#### VPN Configuration

```yaml
# Use VPN for secure communication
services:
  wazuh-chatbot:
    networks:
      - wazuh-vpn

  openvpn-client:
    image: dperson/openvpn-client
    cap_add:
      - NET_ADMIN
    environment:
      - TZ=UTC
    volumes:
      - ./vpn-config:/vpn
    networks:
      - wazuh-vpn
    command: '-f'
```

## Troubleshooting Integration

### Connection Issues

#### SSL/TLS Problems

```bash
# Test SSL connection
openssl s_client -connect wazuh-manager:55000 -servername wazuh-manager

# Accept self-signed certificates (development only)
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

#### Network Connectivity

```bash
# Test basic connectivity
ping wazuh-manager

# Test port accessibility
telnet wazuh-manager 55000

# Check firewall rules
sudo iptables -L | grep 55000
```

### API Response Issues

#### Invalid Credentials

```bash
# Verify credentials
curl -k -u wrong_user:wrong_pass https://wazuh-manager:55000/

# Reset password if needed
/var/ossec/bin/ossec-control stop
# Edit user database or recreate user
/var/ossec/bin/ossec-control start
```

#### Permission Errors

```bash
# Check user permissions in Wazuh
curl -k -u admin:password https://wazuh-manager:55000/security/users

# Verify API user has necessary permissions
curl -k -u api_user:password https://wazuh-manager:55000/agents?limit=1
```

#### Data Format Issues

```typescript
// Debug API responses
const debugResponse = await fetch(wazuhUrl, {
  headers: { 'Authorization': basicAuth },
});

console.log('Status:', debugResponse.status);
console.log('Headers:', Object.fromEntries(debugResponse.headers));
const text = await debugResponse.text();
console.log('Response:', text);

// Try to parse JSON
try {
  const data = JSON.parse(text);
  console.log('Parsed data:', data);
} catch (error) {
  console.error('JSON parse error:', error);
}
```

### Performance Issues

#### Slow Queries

```sql
-- Check Wazuh database performance
# sqlite3 /var/ossec/queue/db/wazuh.db
.schema alerts
SELECT COUNT(*) FROM alerts;
EXPLAIN QUERY PLAN SELECT * FROM alerts WHERE rule_level >= 10;

-- Optimize database
VACUUM;
REINDEX;
```

#### Memory Issues

```bash
# Monitor Wazuh manager memory usage
ps aux | grep ossec

# Check system resources
free -h
df -h

# Review Wazuh configuration for memory limits
grep -r "memory" /var/ossec/etc/
```

## Migration and Upgrades

### Version Compatibility

| Wazuh Version | Chatbot Compatibility | Notes |
|---------------|----------------------|-------|
| 4.4.x | ✅ Full support | Current recommended version |
| 4.3.x | ✅ Compatible | Some features limited |
| 4.2.x | ⚠️ Limited | Basic functionality only |
| 4.1.x | ❌ Not supported | API changes incompatible |

### Upgrade Procedure

1. **Backup current configuration**
   ```bash
   cp -r /var/ossec /var/ossec.backup
   pg_dump wazuh > wazuh_backup.sql  # If using PostgreSQL
   ```

2. **Stop services**
   ```bash
   systemctl stop wazuh-chatbot
   systemctl stop wazuh-manager
   ```

3. **Upgrade Wazuh**
   ```bash
   # Follow Wazuh upgrade documentation
   # Example for 4.4.x
   yum update wazuh-manager
   ```

4. **Update chatbot configuration**
   ```typescript
   // Check for API changes in new version
   // Update endpoint URLs if necessary
   const API_VERSION = 'v4.4';
   ```

5. **Test integration**
   ```bash
   # Start services
   systemctl start wazuh-manager
   systemctl start wazuh-chatbot

   # Test API connectivity
   curl -k -u api_user:password https://wazuh-manager:55000/version
   ```

6. **Verify functionality**
   - Test alert queries
   - Verify agent communication
   - Check vulnerability scans

## Best Practices

### API Usage Guidelines

1. **Rate Limiting**: Implement appropriate delays between requests
2. **Pagination**: Always use pagination for large datasets
3. **Filtering**: Use specific filters to reduce data transfer
4. **Caching**: Cache frequently accessed data
5. **Error Handling**: Implement robust error handling and retries

### Security Best Practices

1. **Use HTTPS**: Always use encrypted connections
2. **Strong Credentials**: Use complex passwords for API users
3. **Network Security**: Restrict API access to trusted networks
4. **Monitoring**: Monitor API usage and failed authentication attempts
5. **Updates**: Keep Wazuh and dependencies updated

### Performance Best Practices

1. **Query Optimization**: Use specific filters and time ranges
2. **Background Processing**: Process large datasets asynchronously
3. **Resource Limits**: Set appropriate memory and CPU limits
4. **Load Balancing**: Use multiple Wazuh managers if needed
5. **Monitoring**: Implement comprehensive monitoring and alerting

This integration guide should be updated as new Wazuh versions are released and as the chatbot functionality evolves.