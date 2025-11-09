# User Guide

Welcome to the Wazuh Security Chatbot! This guide will help you effectively use the chatbot to monitor and analyze your security infrastructure.

## Getting Started

### First Time Setup

1. **Access the Chatbot**:
   - Open your browser and navigate to http://localhost:3000 (or your configured URL)
   - The main chat interface will load with a welcome message

2. **Initial Configuration**:
   - Ensure your Wazuh Manager is properly configured and accessible
   - Verify that the chatbot can connect to your Wazuh API (check the environment variables)

3. **Test Basic Functionality**:
   - Try one of the quick action buttons to see how the chatbot responds
   - Ask a simple question like "Show me critical alerts"

## Interface Overview

### Main Chat Interface

#### Header Section
- **Wazuh Security Chatbot** title with description
- **Alerts Dashboard** button - navigate to detailed alert view

#### Quick Actions Panel
Pre-configured security queries for common monitoring tasks:

- **🚨 Critical Alerts** - Show critical alerts from the last hour
- **🔴 Offline Agents** - List all disconnected agents
- **🛡️ High Vulnerabilities** - Critical and high severity vulnerabilities
- **📊 Agent Status** - Overview of all agent statuses
- **📈 Recent Activity** - Recent security events and alerts
- **🔍 Threat Analysis** - Analyze current threat landscape
- **📋 Syslog Errors** - Recent system log errors
- **✅ Compliance Status** - Check compliance monitoring alerts
- **🌐 Network Anomalies** - Detect unusual network activity
- **🔐 Failed Logins** - Authentication failure attempts
- **💾 Disk Usage** - Monitor disk space alerts
- **⚙️ Service Status** - Check critical service statuses

#### Chat Area
- **Message List** - Conversational history with auto-scroll
- **Message Bubbles** - User messages (right) and AI responses (left)
- **Typing Indicators** - Shows when the AI is processing

#### Input Area
- **Multi-line Text Input** - Type your security questions
- **Send Button** - Submit your query (or press Enter)

### Alerts Dashboard

Access via the "Alerts Dashboard" button in the header.

#### Features:
- **Severity Statistics** - Visual breakdown of alert levels
- **Filter Controls** - Filter by severity, time, and search terms
- **Alert List** - Detailed view of security alerts
- **Alert Details** - Expandable alert information including:
  - Severity level and rule ID
  - Affected agent information
  - Timestamp and location
  - Full log content

## Using the Chatbot

### Natural Language Queries

The chatbot understands natural language security queries. Here are some examples:

#### Alert Monitoring
```
"Show me all critical alerts from the last 24 hours"
"What are the most common alert types today?"
"Are there any alerts from agent server-01?"
"Show me alerts with rule ID 1002"
```

#### Agent Management
```
"Which agents are currently offline?"
"Give me a summary of agent statuses"
"How many agents are active right now?"
"Show me details for agent 001"
```

#### Vulnerability Analysis
```
"Are there any critical vulnerabilities?"
"Show me vulnerabilities on web servers"
"What are the latest vulnerability scans?"
"Summarize high-severity vulnerabilities"
```

#### Security Analysis
```
"Analyze the current threat situation"
"What security events happened today?"
"Are there any brute force attempts?"
"Check for network anomalies"
```

#### System Monitoring
```
"Are there any disk space alerts?"
"Show me service status issues"
"What syslog errors occurred recently?"
"Check compliance status"
```

### Quick Actions

The quick action buttons provide instant access to common monitoring tasks:

1. **Click any button** to automatically send that query
2. **Results appear** in the chat area with AI analysis
3. **Follow-up questions** can be asked for more details

### Best Practices for Queries

#### Be Specific
- Include time frames: "last hour", "today", "this week"
- Specify severity levels: "critical", "high", "medium"
- Mention specific agents or groups when relevant

#### Use Clear Language
- Avoid ambiguous terms
- Be specific about what you're looking for
- Use security terminology when appropriate

#### Ask Follow-up Questions
- Start with broad queries, then drill down
- Ask for clarification if results are unclear
- Request specific details about concerning findings

## Understanding Responses

### Response Types

#### Summary Responses
The AI provides:
- **Overview** - High-level summary of findings
- **Key Statistics** - Important numbers and counts
- **Insights** - Actionable recommendations
- **Next Steps** - Suggested follow-up actions

#### Data Tables
For detailed results:
- **Structured Format** - Easy-to-read tables
- **Severity Indicators** - Color-coded risk levels
- **Timestamps** - When events occurred
- **Agent Information** - Which systems are affected

#### Error Messages
If something goes wrong:
- **Clear Error Description** - What went wrong
- **Troubleshooting Steps** - How to resolve
- **Alternative Actions** - What you can try instead

### Severity Levels

The chatbot uses standard Wazuh severity levels:

- **12-15: Critical** 🔴 - Immediate attention required
- **8-11: High** 🟠 - High priority issues
- **4-7: Medium** 🟡 - Moderate concerns
- **0-3: Low** 🔵 - Informational or low-risk

## Advanced Features

### Alert Analysis

#### Filtering and Sorting
- Use the Alerts Dashboard for advanced filtering
- Sort by severity, time, or affected agent
- Search through alert content

#### Trend Analysis
```
"What are the alert trends over the last week?"
"Are critical alerts increasing?"
"Compare today's alerts to yesterday"
```

#### Correlation Analysis
```
"Are there related alerts from the same agent?"
"What other activity happened around this alert?"
"Are there patterns in these alerts?"
```

### Agent Monitoring

#### Health Checks
```
"Show me agent health status"
"Which agents haven't checked in recently?"
"Are there any agent configuration issues?"
```

#### Performance Monitoring
```
"Show me agent resource usage"
"Are there any performance alerts?"
"What agents are using the most resources?"
```

### Vulnerability Management

#### Risk Assessment
```
"What are my highest risk vulnerabilities?"
"Are there unpatched critical vulnerabilities?"
"Show me vulnerability trends"
```

#### Impact Analysis
```
"Which systems are most vulnerable?"
"What would be the impact of these vulnerabilities?"
"Are there vulnerabilities in critical systems?"
```

## Troubleshooting

### Common Issues

#### "No alerts found"
- Check your time range - try a longer period
- Verify Wazuh is collecting data
- Check agent connectivity

#### "Connection failed"
- Verify Wazuh API credentials
- Check network connectivity
- Ensure Wazuh Manager is running

#### "No response from AI"
- Check LLM provider configuration
- Verify API keys (for OpenAI)
- Ensure Ollama is running (for local models)

#### "Database errors"
- Check file permissions
- Verify database path
- Ensure sufficient disk space

### Getting Help

#### Built-in Help
```
"Help me with alert monitoring"
"What can you tell me about agents?"
"Show me vulnerability analysis options"
```

#### Documentation
- Refer to this User Guide
- Check the Administration Guide for configuration help
- Review the Installation Guide for setup issues

## Security Best Practices

### Query Safety
- Avoid sharing sensitive information in queries
- Use the chatbot in secure network environments
- Be aware that queries are logged for audit purposes

### Data Interpretation
- Always verify critical findings through direct Wazuh access
- Understand the context of security events
- Consider false positives in alert analysis

### Regular Monitoring
- Check the dashboard regularly
- Set up alerts for critical conditions
- Review AI insights and recommendations

## Keyboard Shortcuts

- **Enter** - Send message
- **Shift + Enter** - New line in input
- **Ctrl/Cmd + K** - Clear chat (if implemented)
- **Ctrl/Cmd + /** - Show help

## Next Steps

Now that you're familiar with the basics:

1. **Explore Quick Actions** - Try different pre-built queries
2. **Ask Custom Questions** - Experiment with natural language queries
3. **Use the Dashboard** - Dive deeper into alert details
4. **Set Up Monitoring** - Configure regular security checks
5. **Customize for Your Environment** - Adapt queries to your specific needs

For advanced configuration and administration, refer to the Administration Guide.