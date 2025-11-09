import OpenAI from 'openai';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

class LLMService {
  private openai: OpenAI | null = null;
  private tools: Map<string, Tool> = new Map();

  constructor() {
    if (LLM_PROVIDER === 'openai' && OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
    }
  }

  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  private async callOpenAI(messages: ChatMessage[], stream: boolean = false): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI client not configured');
    }

    const toolDefinitions = Array.from(this.tools.values()).map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters,
          required: Object.keys(tool.parameters),
        },
      },
    }));

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as any,
      tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
      tool_choice: toolDefinitions.length > 0 ? 'auto' : undefined,
      stream,
    });

    if (stream) {
      return response;
    }

    const choice = response.choices[0];
    if (choice.message.tool_calls) {
      const toolCall = choice.message.tool_calls[0];
      const tool = this.tools.get(toolCall.function.name);
      if (tool) {
        const params = JSON.parse(toolCall.function.arguments);
        const result = await tool.execute(params);

        // Add tool result to conversation and get final response
        const messagesWithTool = [
          ...messages,
          choice.message,
          {
            role: 'tool' as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          },
        ];

        const finalResponse = await this.callOpenAI(messagesWithTool);
        return finalResponse;
      }
    }

    return choice.message.content;
  }

  private async callOllama(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(OLLAMA_BASE_URL + '/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2', // or any available model
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || data.response || 'No response from Ollama';
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      if (LLM_PROVIDER === 'openai') {
        return await this.callOpenAI(messages);
      } else if (LLM_PROVIDER === 'ollama') {
        return await this.callOllama(messages);
      } else {
        throw new Error(`Unsupported LLM provider: ${LLM_PROVIDER}`);
      }
    } catch (error) {
      console.error('LLM chat error:', error);
      throw new Error('Failed to get response from LLM service');
    }
  }

  async *chatStream(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    try {
      if (LLM_PROVIDER === 'openai') {
        const stream = await this.callOpenAI(messages, true);
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        }
      } else {
        // For Ollama, we'll do non-streaming for now
        const response = await this.chat(messages);
        yield response;
      }
    } catch (error) {
      console.error('LLM streaming error:', error);
      yield 'Sorry, I encountered an error while processing your request.';
    }
  }
}

export { LLMService, type ChatMessage, type Tool };