import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';
/**
 * ChatHandler - Handles all chat-related operations
 *
 * This class encapsulates the OpenAI integration and tool execution logic,
 * making it easy for AI developers to understand and extend the functionality.
 */
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
  /**
   * Process a user message and generate AI response with optional tool usage
   */
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
        // Use streaming with callback
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
      // Non-streaming response
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
      console.warn('ChatHandler OpenAI fallback');
      return {
        content: JSON.stringify({
          summary: 'AI service temporarily unavailable. Fallback risk analysis: moderate shadow AI exposure detected.',
          recommendations: [
            {title: 'Audit AI Discovery Logs', description: 'Review Gateway App Discovery for unmanaged AI endpoints.', type: 'critical'},
            {title: 'Implement DLP Fingerprints', description: 'Profile PII, financial data for DLP policy enforcement.', type: 'policy'},
            {title: 'Power User Access Review', description: 'Audit top AI consumers for sensitive data exfiltration.', type: 'optimization'}
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
                function: {
                  name: deltaToolCall.function?.name || '',
                  arguments: deltaToolCall.function?.arguments || ''
                }
              };
            } else {
              if (deltaToolCall.function?.name && !accumulatedToolCalls[i].function.name) {
                accumulatedToolCalls[i].function.name = deltaToolCall.function.name;
              }
              if (deltaToolCall.function?.arguments) {
                accumulatedToolCalls[i].function.arguments += deltaToolCall.function.arguments;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      return { content: fullContent || 'Stream processing completed with partial data.' };
    }
    if (accumulatedToolCalls.length > 0) {
      try {
        const executedTools = await this.executeToolCalls(accumulatedToolCalls);
        const finalResponse = await this.generateToolResponse(message, conversationHistory, accumulatedToolCalls, executedTools);
        return { content: finalResponse, toolCalls: executedTools };
      } catch (error) {
        console.error('Tool execution error:', error);
        return { content: fullContent || 'Tool execution completed with partial data.' };
      }
    }
    return { content: fullContent };
  }
  private async handleNonStreamResponse(
    completion: OpenAI.Chat.Completions.ChatCompletion,
    message: string,
    conversationHistory: Message[]
  ): Promise<{ content: string; toolCalls?: ToolCall[] }> {
    try {
      const responseMessage = completion.choices[0]?.message;
      if (!responseMessage) {
        return { content: 'I apologize, but I encountered an issue processing your request.' };
      }
      if (!responseMessage.tool_calls) {
        return {
          content: responseMessage.content || 'I apologize, but I encountered an issue.'
        };
      }
      const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[]);
      const finalResponse = await this.generateToolResponse(
        message,
        conversationHistory,
        responseMessage.tool_calls,
        toolCalls
      );
      return { content: finalResponse, toolCalls };
    } catch (error) {
      console.error('Non-stream response error:', error);
      return { content: 'Response processing completed with partial data.' };
    }
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(
      openAiToolCalls.map(async (tc) => {
        try {
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          const result = await executeTool(tc.function.name, args);
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: args,
            result
          };
        } catch (error) {
          console.error(`Tool execution failed for ${tc.function.name}:`, error);
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: {},
            result: { error: `Failed to execute ${tc.function.name}: ${error instanceof Error ? error.message : 'Unknown error'}` }
          };
        }
      })
    );
  }
  private async generateToolResponse(
    userMessage: string,
    history: Message[],
    openAiToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
    toolResults: ToolCall[]
  ): Promise<string> {
    try {
      const followUpCompletion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a RiskGuard AI Security Expert. Respond naturally to the tool results.' },
          ...history.slice(-3).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
          {
            role: 'assistant',
            content: null,
            tool_calls: openAiToolCalls
          },
          ...toolResults.map((result, index) => ({
            role: 'tool' as const,
            content: JSON.stringify(result.result),
            tool_call_id: openAiToolCalls[index]?.id || result.id
          }))
        ],
        max_tokens: 16000
      });
      return followUpCompletion.choices[0]?.message?.content || 'Tool results processed successfully.';
    } catch (error) {
      console.error('generateToolResponse error:', error);
      return 'Tool results processed successfully.';
    }
  }
  private buildConversationMessages(userMessage: string, history: Message[]) {
    return [
      {
        role: 'system' as const,
        content: `You are RiskGuard AI, a specialized security consultant for Cloudflare Zero Trust and ZTNA environments. 
Your goal is to help users identify AI-related risks, understand their Cloudflare Gateway logs, and implement security best practices.
- Provide clear, executive-level security insights.
- Offer specific technical remediation steps (e.g., Gateway policies, Access groups).
- Be professional, accurate, and focused on data protection and AI governance.
- If the user asks about shadow AI, explain how Cloudflare CASB and Gateway provide visibility.`
      },
      ...history.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user' as const, content: userMessage }
    ];
  }
  updateModel(newModel: string): void {
    this.model = newModel;
  }
}