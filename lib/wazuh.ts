import { NextRequest } from 'next/server';

const WAZUH_BASE_URL = process.env.WAZUH_API_BASE_URL;
const WAZUH_USER = process.env.WAZUH_API_USER;
const WAZUH_PASS = process.env.WAZUH_API_PASS;

interface WazuhResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

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
  decoder: {
    name: string;
  };
  location: string;
  full_log: string;
}

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

class WazuhClient {
  private baseUrl: string;
  private auth: string;

  constructor(baseUrl: string, user: string, pass: string) {
    this.baseUrl = baseUrl;
    this.auth = Buffer.from(`${user}:${pass}`).toString('base64');
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<WazuhResponse<T>> {
    try {
      const url = new URL(endpoint, this.baseUrl);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Wazuh API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Wazuh API request failed:', error);
      throw new Error(`Failed to fetch from Wazuh API: ${error}`);
    }
  }

  async getAlerts(params?: {
    limit?: number;
    offset?: number;
    sort?: string;
    search?: string;
    time?: string;
    level?: string;
  }): Promise<WazuhResponse<{ alerts: Alert[]; total: number }>> {
    return this.request('/events/alerts', params);
  }

  async getAgents(params?: {
    limit?: number;
    offset?: number;
    sort?: string;
    search?: string;
    status?: string;
  }): Promise<WazuhResponse<{ agents: Agent[]; total: number }>> {
    return this.request('/agents', params);
  }

  async getAgent(agentId: string): Promise<WazuhResponse<Agent>> {
    return this.request(`/agents/${agentId}`);
  }

  async getVulnerabilities(params?: {
    limit?: number;
    offset?: number;
    agent_id?: string;
    cve?: string;
    severity?: string;
  }): Promise<WazuhResponse<{ vulnerabilities: Vulnerability[]; total: number }>> {
    return this.request('/vulnerability', params);
  }

  async getSecurityEvents(params?: {
    limit?: number;
    offset?: number;
    sort?: string;
    search?: string;
    time?: string;
  }): Promise<WazuhResponse<{ events: any[]; total: number }>> {
    return this.request('/events', params);
  }
}

let wazuhClient: WazuhClient | null = null;

function getWazuhClient(): WazuhClient {
  if (!wazuhClient) {
    if (!WAZUH_BASE_URL || !WAZUH_USER || !WAZUH_PASS) {
      throw new Error('Wazuh environment variables are not configured');
    }
    wazuhClient = new WazuhClient(WAZUH_BASE_URL, WAZUH_USER, WAZUH_PASS);
  }
  return wazuhClient;
}

export { getWazuhClient, type Alert, type Agent, type Vulnerability, type WazuhResponse };