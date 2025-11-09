'use client';

import React, { useState, useEffect } from 'react';

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

interface AlertData {
  alerts: Alert[];
  total: number;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    level: '',
    limit: 50,
    search: '',
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter.level) params.append('level', filter.level);
      if (filter.limit) params.append('limit', filter.limit.toString());
      if (filter.search) params.append('search', filter.search);

      const response = await fetch(`/api/tools/alerts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data: AlertData = await response.json();
      setAlerts(data.alerts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const getSeverityColor = (level: number) => {
    if (level >= 12) return 'bg-red-600 text-white';
    if (level >= 8) return 'bg-orange-600 text-white';
    if (level >= 4) return 'bg-yellow-600 text-black';
    return 'bg-blue-600 text-white';
  };

  const getSeverityLabel = (level: number) => {
    if (level >= 12) return 'Critical';
    if (level >= 8) return 'High';
    if (level >= 4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-700 bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🚨</div>
            <div>
              <h1 className="text-xl font-semibold text-white">Alerts Dashboard</h1>
              <p className="text-sm text-gray-400">Monitor security alerts and threats</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 transition-colors"
            >
              ← Back to Chat
            </a>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 rounded-lg bg-gray-800 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Severity Level
              </label>
              <select
                value={filter.level}
                onChange={(e) => setFilter(prev => ({ ...prev, level: e.target.value }))}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Levels</option>
                <option value="12">Critical (12-15)</option>
                <option value="8">High (8-11)</option>
                <option value="4">Medium (4-7)</option>
                <option value="0">Low (0-3)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Limit
              </label>
              <select
                value={filter.limit}
                onChange={(e) => setFilter(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
              >
                <option value={20}>20 alerts</option>
                <option value={50}>50 alerts</option>
                <option value={100}>100 alerts</option>
                <option value={200}>200 alerts</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search alerts..."
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-800 p-4">
            <div className="text-2xl font-bold text-red-400">{alerts.filter(a => a.rule.level >= 12).length}</div>
            <div className="text-sm text-gray-400">Critical</div>
          </div>
          <div className="rounded-lg bg-gray-800 p-4">
            <div className="text-2xl font-bold text-orange-400">{alerts.filter(a => a.rule.level >= 8 && a.rule.level < 12).length}</div>
            <div className="text-sm text-gray-400">High</div>
          </div>
          <div className="rounded-lg bg-gray-800 p-4">
            <div className="text-2xl font-bold text-yellow-400">{alerts.filter(a => a.rule.level >= 4 && a.rule.level < 8).length}</div>
            <div className="text-sm text-gray-400">Medium</div>
          </div>
          <div className="rounded-lg bg-gray-800 p-4">
            <div className="text-2xl font-bold text-blue-400">{alerts.filter(a => a.rule.level < 4).length}</div>
            <div className="text-sm text-gray-400">Low</div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="rounded-lg bg-gray-800">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading alerts...</div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400">{error}</div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No alerts found</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.rule.level)}`}>
                          {getSeverityLabel(alert.rule.level)}
                        </span>
                        <span className="text-sm text-gray-400">Rule {alert.rule.id}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-400">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="mb-2">
                        <h3 className="text-white font-medium">{alert.rule.description}</h3>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        <span className="font-medium">Agent:</span> {alert.agent.name} (ID: {alert.agent.id})
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        <span className="font-medium">Location:</span> {alert.location}
                      </div>
                      <div className="text-sm text-gray-300 bg-gray-900 p-2 rounded border-l-4 border-gray-600">
                        {alert.full_log}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}