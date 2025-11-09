# Installation Guide

This guide provides step-by-step instructions for installing and configuring the Wazuh Security Chatbot.

## Prerequisites

Before installing the chatbot, ensure you have the following:

### System Requirements
- **Node.js**: Version 18 or higher
- **npm**: Latest version (comes with Node.js)
- **Wazuh Manager**: Version 4.4+ with REST API enabled
- **Optional**: Docker and Docker Compose for containerized deployment

### Quick Prerequisite Installation

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker (optional)
sudo apt-get install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
```

#### CentOS/RHEL
```bash
# Install Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Docker (optional)
sudo yum install -y docker docker-compose
sudo systemctl enable docker
sudo systemctl start docker
```

#### macOS
```bash
# Install Node.js 18+ using Homebrew
brew install node@18

# Install Docker (optional)
brew install --cask docker
```

#### Windows
```powershell
# Install Node.js 18+ from https://nodejs.org/
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
```

> **Note**: All installations above include npm automatically with Node.js. For Docker, you may need to add your user to the docker group: `sudo usermod -aG docker $USER`

### Wazuh Manager Setup
1. **Install Wazuh Manager**:
   ```bash
   # Ubuntu/Debian
   curl -sO https://packages.wazuh.com/4.4/wazuh-install.sh && sudo bash ./wazuh-install.sh -a

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
   sudo yum install wazuh-manager
   ```

2. **Enable REST API**:
   Edit `/var/ossec/etc/ossec.conf`:
   ```xml
   <ossec_config>
       <global>
           <jsonout_output>yes</jsonout_output>
       </global>

       <!-- RESTful API configuration -->
       <remote>
           <connection>secure</connection>
           <port>55000</port>
           <protocol>tcp</protocol>
       </remote>
   </ossec_config>
   ```

3. **Create API User**:
   ```bash
   sudo /var/ossec/bin/ossec-control start
   sudo /var/ossec/framework/python/bin/python3 -c "
   from wazuh.core.cluster.dapi.dapi import DistributedAPI
   from wazuh.core.configuration import read_yaml_config
   import getpass

   # Create API user
   username = 'api_user'
   password = getpass.getpass('Enter password for API user: ')

   # This is a simplified example - refer to Wazuh docs for proper user creation
   "
   ```

## Installation Methods

### Method 1: Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd wazuh-chatbot
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

3. **Deploy with Docker Compose**:
   ```bash
   # Build and start all services
   docker-compose up --build

   # Run in background
   docker-compose up -d --build
   ```

4. **Access the application**:
   - Chatbot: http://localhost:3000
   - ChromaDB: http://localhost:8000 (vector database)
   - Ollama: http://localhost:11434 (optional local LLM)

### Method 2: Local Development Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd wazuh-chatbot
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Wazuh and API settings
   ```

3. **Initialize embeddings (optional)**:
   ```bash
   npm run ingest
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - http://localhost:3000

### Method 3: Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Configure production environment**:
   ```bash
   cp .env.example .env.production
   # Set production values
   ```

3. **Start production server**:
   ```bash
   npm start
   ```

## Environment Configuration

### Required Environment Variables

```env
# Wazuh API Configuration
WAZUH_API_BASE_URL=https://your-wazuh-manager:55000
WAZUH_API_USER=your_api_username
WAZUH_API_PASS=your_api_password

# AI Provider Configuration
LLM_PROVIDER=openai  # or 'ollama'
OPENAI_API_KEY=sk-your-openai-api-key

# Security Configuration
SESSION_SECRET=your-secure-random-secret

# Database Configuration
DATABASE_URL=file:./sqlite.db
```

### Optional Environment Variables

```env
# Ollama Configuration (if using local LLM)
OLLAMA_BASE_URL=http://localhost:11434

# Database Path (SQLite)
DATABASE_URL=file:./data/chatbot.db

# Logging Level
LOG_LEVEL=info
```

## Wazuh Integration Setup

### 1. Verify Wazuh API Access

Test your Wazuh API connection:
```bash
curl -k -u api_user:password https://wazuh-manager:55000/
```

### 2. Configure Firewall

Ensure port 55000 is accessible:
```bash
# UFW (Ubuntu)
sudo ufw allow 55000/tcp

# firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=55000/tcp
sudo firewall-cmd --reload
```

### 3. SSL Certificate Configuration

For production, configure SSL certificates:
```bash
# Copy certificates to Wazuh
sudo cp /path/to/cert.pem /var/ossec/etc/sslmanager.cert
sudo cp /path/to/key.pem /var/ossec/etc/sslmanager.key

# Restart Wazuh
sudo systemctl restart wazuh-manager
```

## LLM Provider Setup

### OpenAI Configuration

1. **Get API Key**:
   - Visit https://platform.openai.com/
   - Create an account and generate an API key
   - Add to `.env.local`: `OPENAI_API_KEY=sk-your-key-here`

2. **Test Connection**:
   ```bash
   curl -H "Authorization: Bearer sk-your-key" \
        -H "Content-Type: application/json" \
        -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Hello"}]}' \
        https://api.openai.com/v1/chat/completions
   ```

### Ollama Configuration (Local LLM)

1. **Install Ollama**:
   ```bash
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh

   # macOS
   brew install ollama

   # Windows
   # Download from https://ollama.ai/download
   ```

2. **Pull Models**:
   ```bash
   ollama pull llama2
   ollama pull codellama
   ```

3. **Start Ollama Service**:
   ```bash
   ollama serve
   ```

4. **Configure Environment**:
   ```env
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   ```

## Database Setup

The application uses SQLite by default. For production:

1. **Create database directory**:
   ```bash
   mkdir -p /var/lib/wazuh-chatbot
   chown -R nodejs:nodejs /var/lib/wazuh-chatbot
   ```

2. **Update environment**:
   ```env
   DATABASE_URL=file:/var/lib/wazuh-chatbot/database.db
   ```

## Troubleshooting Installation

### Common Issues

1. **Wazuh API Connection Failed**:
   - Verify API credentials
   - Check firewall settings
   - Ensure SSL certificates are valid

2. **LLM Service Unavailable**:
   - Test API keys
   - Verify Ollama is running
   - Check network connectivity

3. **Database Permission Errors**:
   - Ensure write permissions on database directory
   - Check file ownership

4. **Build Failures**:
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules: `rm -rf node_modules`
   - Reinstall: `npm install`

### Health Checks

Test your installation:
```bash
# Test chatbot API
curl http://localhost:3000/api/health

# Test Wazuh integration
curl http://localhost:3000/api/tools/alerts

# Check logs
docker-compose logs wazuh-chatbot
```

## Security Considerations

### Production Deployment Checklist
- [ ] Use HTTPS in production
- [ ] Configure proper firewall rules
- [ ] Use strong API passwords
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Monitor application logs

### SSL Configuration for Nginx (Example)
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Next Steps

After installation:
1. Access the chatbot at http://localhost:3000
2. Try the quick action buttons
3. Configure additional users and permissions
4. Set up monitoring and alerting
5. Review the User Guide for detailed usage instructions

For additional help, refer to the Administration Guide or create an issue in the repository.