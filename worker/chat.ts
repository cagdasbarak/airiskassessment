import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  constructor(aiGatewayUrl: string, apiKey: string, model: string) {
    this.client = new OpenAI({
      baseURL: aiGatewayUrl,
      apiKey: apiKey,
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
          tools: toolDefinitions as any,
          tool_choice: 'auto',
          max_completion_tokens: 16000,
          stream: true,
        });
        return await this.handleStreamResponse(stream, message, conversationHistory, onChunk);
      }
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions as any,
        tool_choice: 'auto',
        max_tokens: 16000,
        stream: false
      });
      return this.handleNonStreamResponse(completion, message, conversationHistory);
    } catch (error) {
      console.error('AI Service Exception:', error);
      return {
        content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.",
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
    const accumulatedToolCalls: any[] = [];
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          onChunk(delta.content);
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const i = tc.index;
            if (!accumulatedToolCalls[i]) {
              accumulatedToolCalls[i] = {
                id: tc.id,
                type: 'function',
                function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' }
              };
            } else {
              if (tc.function?.name) accumulatedToolCalls[i].function.name = tc.function.name;
              if (tc.function?.arguments) accumulatedToolCalls[i].function.arguments += tc.function.arguments;
            }
          }
        }
      }
    } catch (e) {
      console.error('Stream processing failure:', e);
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
    if (!responseMessage) return { content: 'Internal AI routing failure.' };
    if (!responseMessage.tool_calls) return { content: responseMessage.content || '' };
    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls);
    const finalResponse = await this.generateToolResponse(message, history, responseMessage.tool_calls, toolCalls);
    return { content: finalResponse, toolCalls };
  }
  private async executeToolCalls(openAiToolCalls: any[]): Promise<ToolCall[]> {
    return Promise.all(openAiToolCalls.map(async (tc) => {
      try {
        const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
        const result = await executeTool(tc.function.name, args);
        return { id: tc.id, name: tc.function.name, arguments: args, result };
      } catch (e) {
        console.error(`Tool execution error [${tc.function.name}]:`, e);
        return { id: tc.id, name: tc.function.name, arguments: {}, result: { error: 'Execution failed' } };
      }
    }));
  }
  private async generateToolResponse(msg: string, history: Message[], calls: any[], results: ToolCall[]): Promise<string> {
    try {
      const followUp = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are RiskGuard AI Expert. Synthesize tool results into executive insights.' },
          ...history.slice(-3).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: msg },
          { role: 'assistant', content: null, tool_calls: calls } as any,
          ...results.map((r, i) => ({
            role: 'tool' as const,
            content: JSON.stringify(r.result),
            tool_call_id: calls[i]?.id || r.id
          }))
        ],
        max_tokens: 4000
      });
      return followUp.choices[0]?.message?.content || 'Analysis synthesis failed.';
    } catch (e) {
      console.error('Tool response generation failure:', e);
      return 'Tool results received but final summary failed.';
    }
  }
  private buildConversationMessages(userMessage: string, history: Message[]) {
    return [
      { role: 'system' as const, content: 'You are RiskGuard AI, a security consultant for Cloudflare Zero Trust. Provide professional, data-driven risk assessments.' },
      ...history.slice(-5).map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage }
    ];
  }
  updateModel(newModel: string): void {
    this.model = newModel;
  }
}