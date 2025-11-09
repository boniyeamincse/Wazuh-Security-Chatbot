// Simple RAG implementation using ChromaDB
// In production, this would be more sophisticated

interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

interface VectorSearchResult {
  documents: Document[];
  scores: number[];
}

class RAGService {
  private documents: Document[] = [];
  private vectors: number[][] = [];

  // Simple TF-IDF style search (production would use embeddings)
  private vectorize(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const vector: number[] = [];
    const uniqueWords = Array.from(new Set(words));

    // Create a simple bag-of-words vector
    for (const word of uniqueWords) {
      vector.push(words.filter(w => w === word).length);
    }

    return vector;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return magA && magB ? dotProduct / (magA * magB) : 0;
  }

  async addDocument(doc: Document): Promise<void> {
    this.documents.push(doc);
    this.vectors.push(this.vectorize(doc.content));
  }

  async addDocuments(docs: Document[]): Promise<void> {
    for (const doc of docs) {
      await this.addDocument(doc);
    }
  }

  async search(query: string, limit: number = 5): Promise<VectorSearchResult> {
    const queryVector = this.vectorize(query);
    const similarities = this.vectors.map(vec => this.cosineSimilarity(queryVector, vec));

    // Sort by similarity score
    const results = this.documents
      .map((doc, i) => ({ doc, score: similarities[i] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      documents: results.map(r => r.doc),
      scores: results.map(r => r.score),
    };
  }

  async getContext(query: string, limit: number = 3): Promise<string> {
    const results = await this.search(query, limit);
    if (results.documents.length === 0) {
      return '';
    }

    return results.documents
      .map(doc => `Document: ${doc.content}\nSource: ${doc.metadata.source || 'Unknown'}`)
      .join('\n\n');
  }
}

let ragService: RAGService | null = null;

function getRAGService(): RAGService {
  if (!ragService) {
    ragService = new RAGService();
  }
  return ragService;
}

// Initialize with some Wazuh documentation
async function initializeRAGDocs(): Promise<void> {
  const service = getRAGService();

  const wazuhDocs: Document[] = [
    {
      id: 'alert-levels',
      content: 'Wazuh alert levels range from 0-15, where 0-3 are informational, 4-7 are low severity, 8-11 are medium severity, and 12-15 are high/critical severity alerts.',
      metadata: { source: 'Wazuh Documentation', type: 'alerts' },
    },
    {
      id: 'agent-status',
      content: 'Wazuh agents can have three main statuses: active (online and communicating), disconnected (offline but previously connected), and never_connected (agent installed but never checked in).',
      metadata: { source: 'Wazuh Documentation', type: 'agents' },
    },
    {
      id: 'vulnerabilities',
      content: 'Wazuh vulnerability detection scans agents for known CVEs and provides severity ratings: Critical, High, Medium, and Low. Scan frequency can be configured per agent.',
      metadata: { source: 'Wazuh Documentation', type: 'vulnerabilities' },
    },
    {
      id: 'common-queries',
      content: 'Common security queries include: critical alerts in last hour, offline agents, high-severity vulnerabilities, and active agent count.',
      metadata: { source: 'Security Best Practices', type: 'queries' },
    },
  ];

  await service.addDocuments(wazuhDocs);
}

export { getRAGService, initializeRAGDocs, type Document, type VectorSearchResult };