import { NextRequest, NextResponse } from 'next/server';
import { LLMService, type ChatMessage, type Tool } from '@/lib/llm';
import { getWazuhClient } from '@/lib/wazuh';
import { createAuditMiddleware } from '@/lib/auth';
import { insertChatHistory } from '@/lib/db';

// Initialize LLM service
const llmService = new LLMService();

// Register tools for Wazuh data access
const getAlertsTool: Tool = {
  name: 'get_alerts',
  description: 'Get security alerts from Wazuh with optional filtering',
  parameters: {
    limit: { type: 'number', description: 'Number of alerts to retrieve (default: 20)' },
    level: { type: 'string', description: 'Minimum alert level (e.g., "10" for critical)' },
    time: { type: 'string', description: 'Time filter (e.g., "1h" for last hour)' },
  },
  execute: async (params: { limit?: number; level?: string; time?: string }) => {
    const client = getWazuhClient();
    return await client.getAlerts(params);
  },
};

const getAgentsTool: Tool = {
  name: 'get_agents',
  description: 'Get agent status information from Wazuh',
  parameters: {
    status: { type: 'string', description: 'Agent status filter (active, disconnected, never_connected)' },
    limit: { type: 'number', description: 'Number of agents to retrieve (default: 20)' },
  },
  execute: async (params: { status?: string; limit?: number }) => {
    const client = getWazuhClient();
    return await client.getAgents(params);
  },
};

const getVulnerabilitiesTool: Tool = {
  name: 'get_vulnerabilities',
  description: 'Get vulnerability information from Wazuh agents',
  parameters: {
    agent_id: { type: 'string', description: 'Specific agent ID to check' },
    severity: { type: 'string', description: 'Severity filter (Critical, High, Medium, Low)' },
    limit: { type: 'number', description: 'Number of vulnerabilities to retrieve (default: 50)' },
  },
  execute: async (params: { agent_id?: string; severity?: string; limit?: number }) => {
    const client = getWazuhClient();
    return await client.getVulnerabilities(params);
  },
};

// Register tools
llmService.registerTool(getAlertsTool);
llmService.registerTool(getAgentsTool);
llmService.registerTool(getVulnerabilitiesTool);

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionId }: { messages: ChatMessage[]; sessionId?: string } = await request.json();

    // Add system prompt for Wazuh context
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are a helpful cybersecurity assistant integrated with Wazuh SIEM. You have access to security alerts, agent status, and vulnerability data. Use the available tools to gather information and provide clear, actionable insights. Always be concise but informative in your responses. When providing summaries, include key statistics and actionable recommendations.`,
    };

    const fullMessages: ChatMessage[] = [systemMessage, ...messages];

    // For now, we'll use non-streaming response. Streaming can be added later
    const response = await llmService.chat(fullMessages);

    // Log chat interaction
    if (sessionId && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        insertChatHistory({
          sessionId,
          userMessage: lastUserMessage.content,
          assistantMessage: response,
          timestamp: Date.now(),
        });
      }
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}