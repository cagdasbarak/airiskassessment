import type { Message } from './types';
export const createMessage = (role: 'user' | 'assistant', content: string, toolCalls?: any[]): Message => ({
  id: crypto.randomUUID(),
  role,
  content,
  timestamp: Date.now(),
  ...(toolCalls && { toolCalls })
});
export const createStreamResponse = (readable: ReadableStream) => new Response(readable, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  },
});
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const createEncoder = () => new TextEncoder();
/**
 * Robustly extracts JSON from a string, handling markdown code blocks.
 */
export function extractJson<T>(content: string): T | null {
  try {
    // 1. Try direct parse
    return JSON.parse(content) as T;
  } catch {
    try {
      // 2. Try extracting from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim()) as T;
      }
      // 3. Try finding the first '{' and last '}'
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const potentialJson = content.slice(start, end + 1);
        return JSON.parse(potentialJson) as T;
      }
    } catch (e) {
      console.error('Json extraction failed:', e);
    }
  }
  return null;
}