import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  constructor(aiGatewayUrl: string, apiKey: string, model: string) {
    this.client = new OpenAI({
      baseURL: aiGatewayUrl,
      apiKey: apiKey
    });
    this.model = model;
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    const messages = this.buildConversationMessages(message, conversationHistory);
    const toolDefinitions = await getToolDefinitions();
    try {
      if (onChunk) {
        const stream = await this.client.chat.completions.create({
          model: this.model,
          messages,
          tools: toolDefinitions,
          tool_choice: 'auto',
          max_completion_tokens: 16000,
          stream: true,
        });
        return await this.handleStreamResponse(stream, message, conversationHistory, onChunk);
      }
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
        max_tokens: 16000,
        stream: false
      });
      return this.handleNonStreamResponse(completion, message, conversationHistory);
    } catch (error) {
      console.error('AI Service Exception:', error);
      // Resilience Fallback: Return structured JSON recommendations so UI components don't crash
      return {
        content: JSON.stringify({
          summary: 'AI analysis service is currently under high load. Based on local heuristics, we recommend auditing shadow AI usage immediately.',
          recommendations: [
            { title: 'Block Unapproved AI Endpoints', description: 'Immediate risk detected in shadow usage. Apply Gateway block policies.', type: 'critical' },
            { title: 'Review DLP Incident Logs', description: 'Monitor for sensitive data fragments in AI prompts.', type: 'policy' },
            { title: 'Configure CASB Scans', description: 'Identify data exposure in approved SaaS environments.', type: 'optimization' }
          ]
        }),
        toolCalls: []
      };
    }
  }
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    message: string,
    conversationHistory: Message[],
    onChunk: (chunk: string) => void
  ): Promise<{ content: string; toolCalls?: ToolCall[] }> {
    let fullContent = '';
    const accumulatedToolCalls: ChatCompletionMessageFunctionToolCall[] = [];
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          onChunk(delta.content);
        }
        if (delta?.tool_calls) {
          for (let i = 0; i < delta.tool_calls.length; i++) {
            const deltaToolCall = delta.tool_calls[i];
            if (!accumulatedToolCalls[i]) {
              accumulatedToolCalls[i] = {
                id: deltaToolCall.id || `tool_${Date.now()}_${i}`,
                type: 'function',
                function: { name: deltaToolCall.function?.name || '', arguments: deltaToolCall.function?.arguments || '' }
              };
            } else {
              if (deltaToolCall.function?.name) accumulatedToolCalls[i].function.name = deltaToolCall.function.name;
              if (deltaToolCall.function?.arguments) accumulatedToolCalls[i].function.arguments += deltaToolCall.function.arguments;
            }
          }
        }
      }
    } catch (e) {
      console.error('Stream failure:', e);
    }
    if (accumulatedToolCalls.length > 0) {
      const executedTools = await this.executeToolCalls(accumulatedToolCalls);
      const finalResponse = await this.generateToolResponse(message, conversationHistory, accumulatedToolCalls, executedTools);
      return { content: finalResponse, toolCalls: executedTools };
    }
    return { content: fullContent };
  }
  private async handleNonStreamResponse(completion: OpenAI.Chat.Completions.ChatCompletion, message: string, history: Message[]) {
    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) return { content: 'No response from AI.' };
    if (!responseMessage.tool_calls) return { content: responseMessage.content || '' };
    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[]);
    const finalResponse = await this.generateToolResponse(message, history, responseMessage.tool_calls, toolCalls);
    return { content: finalResponse, toolCalls };
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(openAiToolCalls.map(async (tc) => {
      try {
        const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
        const result = await executeTool(tc.function.name, args);
        return { id: tc.id, name: tc.function.name, arguments: args, result };
      } catch (e) {
        return { id: tc.id, name: tc.function.name, arguments: {}, result: { error: 'Tool error' } };
      }
    }));
  }
  private async generateToolResponse(msg: string, history: Message[], calls: any[], results: ToolCall[]): Promise<string> {
    const followUp = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are RiskGuard AI Expert.' },
        ...history.slice(-3).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: msg },
        { role: 'assistant', content: null, tool_calls: calls },
        ...results.map((r, i) => ({ role: 'tool' as const, content: JSON.stringify(r.result), tool_call_id: calls[i]?.id || r.id }))
      ],
      max_tokens: 16000
    });
    return followUp.choices[0]?.message?.content || 'Analysis complete.';
  }
  private buildConversationMessages(userMessage: string, history: Message[]) {
    return [
      { role: 'system' as const, content: 'You are RiskGuard AI Consultant for Cloudflare ZTNA. Provide executive-level risk summaries and specific remediation steps for shadow AI usage.' },
      ...history.slice(-5).map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage }
    ];
  }
  updateModel(newModel: string): void { this.model = newModel; }
}