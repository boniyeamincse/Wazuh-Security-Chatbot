'use client';

import React from 'react';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  query: string;
  icon: string;
  color: string;
}

interface QuickActionsProps {
  onQuickAction: (query: string) => void;
  disabled?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'critical-alerts',
    label: 'Critical Alerts',
    description: 'Show critical alerts in last hour',
    query: 'Show me all critical alerts from the last hour',
    icon: '🚨',
    color: 'bg-red-600 hover:bg-red-700',
  },
  {
    id: 'offline-agents',
    label: 'Offline Agents',
    description: 'List all disconnected agents',
    query: 'Which agents are currently offline?',
    icon: '🔴',
    color: 'bg-orange-600 hover:bg-orange-700',
  },
  {
    id: 'high-vulnerabilities',
    label: 'High Vulnerabilities',
    description: 'Critical and high severity vulnerabilities',
    query: 'Show me critical and high severity vulnerabilities',
    icon: '🛡️',
    color: 'bg-yellow-600 hover:bg-yellow-700',
  },
  {
    id: 'agent-summary',
    label: 'Agent Status',
    description: 'Overview of all agent statuses',
    query: 'Give me a summary of all agent statuses',
    icon: '📊',
    color: 'bg-green-600 hover:bg-green-700',
  },
  {
    id: 'recent-activity',
    label: 'Recent Activity',
    description: 'Recent security events and alerts',
    query: 'What security events have occurred in the last 24 hours?',
    icon: '📈',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    id: 'threat-analysis',
    label: 'Threat Analysis',
    description: 'Analyze current threat landscape',
    query: 'Analyze the current threat situation and provide insights',
    icon: '🔍',
    color: 'bg-purple-600 hover:bg-purple-700',
  },
  {
    id: 'syslog-errors',
    label: 'Syslog Errors',
    description: 'Recent system log errors',
    query: 'Show me recent syslog errors and system issues',
    icon: '📋',
    color: 'bg-indigo-600 hover:bg-indigo-700',
  },
  {
    id: 'compliance-check',
    label: 'Compliance Status',
    description: 'Check compliance monitoring alerts',
    query: 'What compliance-related alerts have been triggered?',
    icon: '✅',
    color: 'bg-teal-600 hover:bg-teal-700',
  },
  {
    id: 'network-anomalies',
    label: 'Network Anomalies',
    description: 'Detect unusual network activity',
    query: 'Are there any network anomalies or suspicious connections?',
    icon: '🌐',
    color: 'bg-cyan-600 hover:bg-cyan-700',
  },
  {
    id: 'failed-logins',
    label: 'Failed Logins',
    description: 'Authentication failure attempts',
    query: 'Show me recent failed login attempts and brute force indicators',
    icon: '🔐',
    color: 'bg-pink-600 hover:bg-pink-700',
  },
  {
    id: 'disk-usage',
    label: 'Disk Usage',
    description: 'Monitor disk space alerts',
    query: 'Are there any disk space or storage capacity alerts?',
    icon: '💾',
    color: 'bg-gray-600 hover:bg-gray-700',
  },
  {
    id: 'service-status',
    label: 'Service Status',
    description: 'Check critical service statuses',
    query: 'What is the status of critical services across all agents?',
    icon: '⚙️',
    color: 'bg-violet-600 hover:bg-violet-700',
  },
];

export function QuickActions({ onQuickAction, disabled = false }: QuickActionsProps) {
  return (
    <div className="border-b border-gray-700 bg-gray-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-300">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onQuickAction(action.query)}
            disabled={disabled}
            className={`rounded-lg p-3 text-left transition-colors ${action.color} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{action.icon}</span>
              <div>
                <div className="font-medium text-sm">{action.label}</div>
                <div className="text-xs opacity-90">{action.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}