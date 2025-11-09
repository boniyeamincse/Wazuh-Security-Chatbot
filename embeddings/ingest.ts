#!/usr/bin/env node

import { getRAGService, initializeRAGDocs, type Document } from '../lib/rag';
import * as fs from 'fs';
import * as path from 'path';

async function loadWazuhDocumentation(): Promise<Document[]> {
  const docs: Document[] = [];

  // Load static Wazuh documentation
  const wazuhDocs: Document[] = [
    {
      id: 'wazuh-overview',
      content: 'Wazuh is a free, open-source security monitoring platform that provides unified XDR and SIEM protection for endpoints and cloud workloads. It offers threat detection, incident response, compliance, and infrastructure monitoring.',
      metadata: { source: 'Wazuh Official', type: 'overview', category: 'general' },
    },
    {
      id: 'alert-classification',
      content: 'Wazuh alerts are classified by severity levels: 0-3 (informational/low), 4-7 (medium), 8-11 (high), 12-15 (critical). Each alert includes rule ID, description, affected agent, and full log details.',
      metadata: { source: 'Wazuh Documentation', type: 'alerts', category: 'classification' },
    },
    {
      id: 'agent-management',
      content: 'Wazuh agents are deployed on endpoints to collect security data. Agents can be in states: active (online), disconnected (offline), never_connected (not registered). Agent status is updated via keep-alive messages.',
      metadata: { source: 'Wazuh Documentation', type: 'agents', category: 'management' },
    },
    {
      id: 'vulnerability-detection',
      content: 'Wazuh performs vulnerability scans using system inventory data and vulnerability feeds. It detects CVEs with severity ratings: Critical, High, Medium, Low. Scans can be scheduled or run on-demand.',
      metadata: { source: 'Wazuh Documentation', type: 'vulnerabilities', category: 'detection' },
    },
    {
      id: 'common-security-events',
      content: 'Common security events monitored by Wazuh include: file integrity changes, rootkit detection, malware alerts, unauthorized access attempts, configuration changes, and system anomalies.',
      metadata: { source: 'Security Best Practices', type: 'events', category: 'monitoring' },
    },
    {
      id: 'threat-hunting',
      content: 'Security analysts use Wazuh queries to hunt for threats by filtering alerts by time, severity, agent, rule ID, or content. Common queries include critical alerts in last hour, offline agents, and vulnerability summaries.',
      metadata: { source: 'Security Operations', type: 'threat-hunting', category: 'analysis' },
    },
    {
      id: 'incident-response',
      content: 'When security incidents occur, analysts review alert details, check affected systems, assess impact, contain threats, and document response actions. Wazuh provides comprehensive logging for forensic analysis.',
      metadata: { source: 'Incident Response Guide', type: 'response', category: 'operations' },
    },
    {
      id: 'compliance-monitoring',
      content: 'Wazuh helps organizations maintain compliance with standards like PCI-DSS, HIPAA, GDPR through continuous monitoring, audit logging, and automated reporting of security events and configurations.',
      metadata: { source: 'Compliance Documentation', type: 'compliance', category: 'governance' },
    },
  ];

  docs.push(...wazuhDocs);

  // Load additional docs from files if they exist
  const docsDir = path.join(__dirname, 'docs');
  if (fs.existsSync(docsDir)) {
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const doc: Document = {
          id: `file-${file.replace(/\.[^/.]+$/, '')}`,
          content: content.replace(/\n+/g, ' ').trim(),
          metadata: {
            source: 'Local Documentation',
            type: 'documentation',
            filename: file,
            category: 'reference',
          },
        };
        docs.push(doc);
      } catch (error) {
        console.warn(`Failed to load documentation file ${file}:`, error);
      }
    }
  }

  return docs;
}

async function main() {
  console.log('Initializing RAG service...');

  try {
    // Initialize with built-in docs
    await initializeRAGDocs();

    // Load additional documentation
    const additionalDocs = await loadWazuhDocumentation();
    const ragService = getRAGService();

    console.log(`Loading ${additionalDocs.length} documents...`);
    await ragService.addDocuments(additionalDocs);

    console.log('RAG initialization completed successfully!');
    console.log(`Total documents loaded: ${additionalDocs.length + 4}`); // +4 for built-in docs

    // Test the RAG service
    const testQuery = 'alert severity levels';
    const results = await ragService.search(testQuery, 2);
    console.log(`Test query "${testQuery}" returned ${results.documents.length} relevant documents`);

  } catch (error) {
    console.error('Failed to initialize RAG service:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { loadWazuhDocumentation };