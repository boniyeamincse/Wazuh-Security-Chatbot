import { getWazuhClient, type Alert, type Agent, type Vulnerability } from './wazuh';
import { getRAGService } from './rag';

export interface QueryResult {
  data: any;
  summary: string;
  insights: string[];
}

// Alert-related tools
export async function getCriticalAlerts(timeFrame: string = '1h'): Promise<QueryResult> {
  try {
    const client = getWazuhClient();
    const result = await client.getAlerts({
      level: '12', // Critical alerts (12-15)
      time: timeFrame,
      limit: 50,
    });

    const alerts = result.data?.alerts || [];
    const summary = `Found ${alerts.length} critical alerts in the last ${timeFrame}`;
    const insights = [];

    if (alerts.length > 0) {
      const ruleGroups = alerts.reduce((acc: Record<string, number>, alert: Alert) => {
        const ruleId = alert.rule.id;
        acc[ruleId] = (acc[ruleId] || 0) + 1;
        return acc;
      }, {});

      const topRules = Object.entries(ruleGroups)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([ruleId, count]) => `${count} alerts from rule ${ruleId}`);

      insights.push(...topRules);
    }

    return { data: alerts, summary, insights };
  } catch (error) {
    console.error('Error getting critical alerts:', error);
    return {
      data: [],
      summary: 'Failed to retrieve critical alerts',
      insights: ['Check Wazuh connection and authentication']
    };
  }
}

export async function getHighSeverityAlerts(timeFrame: string = '24h'): Promise<QueryResult> {
  try {
    const client = getWazuhClient();
    const result = await client.getAlerts({
      level: '8', // High severity alerts (8-11)
      time: timeFrame,
      limit: 100,
    });

    const alerts = result.data?.alerts || [];
    const summary = `Found ${alerts.length} high-severity alerts in the last ${timeFrame}`;
    const insights = [];

    if (alerts.length > 0) {
      const agentGroups = alerts.reduce((acc: Record<string, number>, alert: Alert) => {
        const agentId = alert.agent.id;
        acc[agentId] = (acc[agentId] || 0) + 1;
        return acc;
      }, {});

      const mostAffected = Object.entries(agentGroups)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([agentId, count]) => `Agent ${agentId}: ${count} alerts`);

      insights.push(...mostAffected);
    }

    return { data: alerts, summary, insights };
  } catch (error) {
    console.error('Error getting high-severity alerts:', error);
    return {
      data: [],
      summary: 'Failed to retrieve high-severity alerts',
      insights: ['Check Wazuh connection and authentication']
    };
  }
}

// Agent-related tools
export async function getOfflineAgents(): Promise<QueryResult> {
  try {
    const client = getWazuhClient();
    const result = await client.getAgents({
      status: 'disconnected',
      limit: 100,
    });

    const agents = result.data?.agents || [];
    const summary = `Found ${agents.length} offline agents`;
    const insights = [];

    if (agents.length > 0) {
      const osStats = agents.reduce((acc: Record<string, number>, agent: Agent) => {
        const os = agent.os.name;
        acc[os] = (acc[os] || 0) + 1;
        return acc;
      }, {});

      insights.push(...Object.entries(osStats).map(([os, count]) => `${count} ${os} agents offline`));
    }

    return { data: agents, summary, insights };
  } catch (error) {
    console.error('Error getting offline agents:', error);
    return {
      data: [],
      summary: 'Failed to retrieve offline agents',
      insights: ['Check Wazuh connection and authentication']
    };
  }
}

export async function getAgentSummary(): Promise<QueryResult> {
  try {
    const client = getWazuhClient();
    const result = await client.getAgents({ limit: 1000 });

    const agents = result.data?.agents || [];
    const summary = `Total agents: ${agents.length}`;

    const statusCounts = agents.reduce((acc: Record<string, number>, agent: Agent) => {
      const status = agent.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const insights = Object.entries(statusCounts).map(([status, count]) =>
      `${count} agents ${status.replace('_', ' ')}`
    );

    return { data: statusCounts, summary, insights };
  } catch (error) {
    console.error('Error getting agent summary:', error);
    return {
      data: {},
      summary: 'Failed to retrieve agent summary',
      insights: ['Check Wazuh connection and authentication']
    };
  }
}

// Vulnerability-related tools
export async function getCriticalVulnerabilities(agentId?: string): Promise<QueryResult> {
  try {
    const client = getWazuhClient();
    const result = await client.getVulnerabilities({
      severity: 'Critical',
      agent_id: agentId,
      limit: 100,
    });

    const vulnerabilities = result.data?.vulnerabilities || [];
    const summary = `Found ${vulnerabilities.length} critical vulnerabilities`;
    const insights = [];

    if (vulnerabilities.length > 0) {
      if (agentId) {
        insights.push(`All critical vulnerabilities are from agent ${agentId}`);
      } else {
        const agentGroups = vulnerabilities.reduce((acc: Record<string, number>, vuln: Vulnerability) => {
          const agent = vuln.agent.id;
          acc[agent] = (acc[agent] || 0) + 1;
          return acc;
        }, {});

        const mostVulnerable = Object.entries(agentGroups)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([agentId, count]) => `Agent ${agentId}: ${count} critical vulnerabilities`);

        insights.push(...mostVulnerable);
      }
    }

    return { data: vulnerabilities, summary, insights };
  } catch (error) {
    console.error('Error getting critical vulnerabilities:', error);
    return {
      data: [],
      summary: 'Failed to retrieve critical vulnerabilities',
      insights: ['Check Wazuh connection and authentication']
    };
  }
}

// General query tool using RAG
export async function searchSecurityKnowledge(query: string): Promise<QueryResult> {
  try {
    const ragService = getRAGService();
    const context = await ragService.getContext(query, 2);

    return {
      data: { context },
      summary: 'Security knowledge retrieved',
      insights: context ? ['Relevant documentation found'] : ['No relevant documentation found'],
    };
  } catch (error) {
    console.error('Error searching security knowledge:', error);
    return {
      data: {},
      summary: 'Failed to search security knowledge',
      insights: ['RAG service error'],
    };
  }
}