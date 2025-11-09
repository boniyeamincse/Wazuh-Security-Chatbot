# Wazuh Security Chatbot

A Next.js-based AI chatbot that integrates with Wazuh SIEM to provide natural language querying capabilities for security analysts. Ask questions about alerts, agent status, vulnerabilities, and security events through an intuitive chat interface.

## Features

- 🤖 **AI-Powered Chat**: Natural language queries about security data using OpenAI GPT or local Ollama models
- 🚨 **Alert Dashboard**: Real-time security alerts with severity filtering and detailed views
- 📊 **Agent Monitoring**: Track agent status, connectivity, and system information
- 🛡️ **Vulnerability Insights**: Query and analyze security vulnerabilities across your infrastructure
- 🔍 **Quick Actions**: Pre-built queries for common security tasks
- 📱 **Modern UI**: Dark cybersecurity-themed interface built with Tailwind CSS
- 🔐 **Security**: RBAC authentication and comprehensive audit logging
- 🐳 **Docker Ready**: Complete containerization with Docker Compose

## Documentation

📚 **[Installation Guide](docs/INSTALLATION.md)** - Complete setup and deployment instructions
👥 **[User Guide](docs/USER_GUIDE.md)** - How to use the chatbot effectively
⚙️ **[Administration Guide](docs/ADMINISTRATION_GUIDE.md)** - System administration and maintenance
🔗 **[Wazuh Integration Guide](docs/WAZUH_INTEGRATION.md)** - Technical integration details

## Architecture

```
wazuh-chatbot/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main chat interface
│   ├── alerts/page.tsx    # Alert dashboard
│   ├── components/        # React components
│   └── api/               # API routes
├── lib/                   # Core business logic
│   ├── wazuh.ts          # Wazuh API client
│   ├── llm.ts            # AI/LLM integration
│   ├── rag.ts            # Document retrieval
│   ├── tools.ts          # Data functions
│   ├── auth.ts           # Authentication & RBAC
│   └── db.ts             # SQLite database
├── embeddings/           # Vector embeddings
└── docker-compose.yml    # Multi-container setup
```

## Prerequisites

- Node.js 18+
- Wazuh Manager with REST API enabled
- OpenAI API key (or Ollama for local models)
- Docker & Docker Compose (for containerized deployment)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd wazuh-chatbot
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Wazuh API Configuration
WAZUH_API_BASE_URL=https://your-wazuh-manager:55000
WAZUH_API_USER=your_api_user
WAZUH_API_PASS=your_api_password

# AI Provider (choose one)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key

# Or use local Ollama
# LLM_PROVIDER=ollama
# OLLAMA_BASE_URL=http://localhost:11434

# Security
SESSION_SECRET=your-secure-random-secret

# Database
DATABASE_URL=file:./sqlite.db
```

### 3. Initialize Embeddings (Optional)

Load Wazuh documentation for enhanced RAG capabilities:

```bash
npm run ingest
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to start chatting with your Wazuh data.

## Docker Deployment

### Complete Stack with Docker Compose

```bash
# Build and run the full stack
docker-compose up --build
```

This starts:
- **Wazuh Chatbot** (port 3000)
- **ChromaDB** vector database (port 8000)
- **Ollama** local LLM (port 11434)

### Individual Services

```bash
# Build the chatbot container
docker build -t wazuh-chatbot .

# Run with environment variables
docker run -p 3000:3000 \
  -e WAZUH_API_BASE_URL=https://your-wazuh:55000 \
  -e OPENAI_API_KEY=sk-your-key \
  wazuh-chatbot
```

## Usage Examples

### Chat Queries
- "Show me critical alerts from the last hour"
- "Which agents are currently offline?"
- "Summarize vulnerability findings for server-01"
- "What security events occurred today?"
- "Give me an overview of agent statuses"

### Quick Actions
Pre-built buttons for common queries:
- 🚨 Critical Alerts
- 🔴 Offline Agents
- 🛡️ High Vulnerabilities
- 📊 Agent Status
- 📈 Recent Activity
- 🔍 Threat Analysis

## Wazuh Integration

### API Endpoints Used
- `/events/alerts` - Security alerts
- `/agents` - Agent status and information
- `/vulnerability` - Vulnerability scans
- `/events` - Security events

### Authentication
The app uses Basic Authentication to connect to Wazuh's REST API. Ensure your Wazuh user has appropriate permissions.

## Security Features

- **RBAC Authentication**: Role-based access control
- **Audit Logging**: All queries and API calls are logged
- **Session Management**: Secure session handling
- **API Security**: Protected backend routes
- **Input Validation**: Sanitized user inputs

## Development

### Project Structure
- **Frontend**: React components with TypeScript
- **Backend**: Next.js API routes
- **Database**: SQLite with better-sqlite3
- **AI**: Modular LLM support (OpenAI/Ollama)
- **RAG**: Simple vector search for document retrieval

### Key Files
- `lib/wazuh.ts` - Wazuh API client
- `lib/llm.ts` - AI chat functionality
- `lib/tools.ts` - Data processing functions
- `app/page.tsx` - Main chat interface
- `app/alerts/page.tsx` - Alert dashboard

### Adding New Tools
Extend the chatbot by adding new tools in `lib/llm.ts`:

```typescript
const newTool: Tool = {
  name: 'new_functionality',
  description: 'Description of what it does',
  parameters: {
    param1: { type: 'string', description: 'Parameter description' }
  },
  execute: async (params) => {
    // Implementation
  }
};
```

## Troubleshooting

### Common Issues

1. **Wazuh Connection Failed**
   - Verify Wazuh API credentials
   - Check network connectivity
   - Ensure Wazuh REST API is enabled

2. **LLM Not Responding**
   - Check API key for OpenAI
   - Verify Ollama is running locally
   - Review environment variables

3. **Database Issues**
   - Ensure write permissions to SQLite file
   - Check database file path in `.env`

### Logs
Check application logs for detailed error information:
```bash
npm run dev  # Development logs
docker-compose logs wazuh-chatbot  # Container logs
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Wazuh](https://wazuh.com/) - Open-source security monitoring
- [OpenAI](https://openai.com/) - AI language models
- [Ollama](https://ollama.ai/) - Local LLM serving
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

**Note**: This application requires a properly configured Wazuh environment. Ensure you have appropriate security measures in place when deploying to production.
