# Cloudflare AI Chat Agents

[![[cloudflarebutton]]](https://workers.cloudflare.com)

A production-ready, full-stack AI chat application built on Cloudflare Workers. Features multi-session management, real-time streaming responses, tool calling (weather, web search, MCP integration), and a modern React frontend.

## ✨ Key Features

- **Multi-Session Chat**: Create, list, switch, rename, and delete persistent chat sessions using Durable Objects.
- **Streaming Responses**: Real-time chat with server-sent events for seamless UX.
- **Tool Calling**: Built-in tools for weather lookup, web search (SerpAPI), URL content fetching, and extensible MCP (Model Context Protocol) tools.
- **AI Model Switching**: Supports multiple models via Cloudflare AI Gateway (Gemini Flash/Pro, etc.).
- **Modern UI**: Responsive React app with shadcn/ui, Tailwind CSS, dark mode, and session sidebar.
- **Production-Ready**: Type-safe TypeScript, error handling, CORS, logging, and client error reporting.
- **Zero-Cold-Start Agents**: Leverages `@cf/agents` for stateful, durable chat agents.

## 🛠 Tech Stack

- **Backend**: Cloudflare Workers, Hono, `@cf/agents` Durable Objects, OpenAI SDK, `@modelcontextprotocol/sdk`
- **Frontend**: React 18, Vite, shadcn/ui, TanStack Query, Tailwind CSS, Lucide Icons
- **Tools & Utils**: SerpAPI (web search), Cloudflare AI Gateway, Immer (state), Zod (validation)
- **Dev Tools**: Bun, Wrangler, TypeScript 5, ESLint, Tailwind

## 🚀 Quick Start

1. **Prerequisites**:
   - [Bun](https://bun.sh) installed
   - [Cloudflare Account](https://dash.cloudflare.com) with Workers enabled
   - Cloudflare AI Gateway setup (for `@cf/meta/llama-*` or `@cf/google/gemini-*` models)
   - Optional: SerpAPI key for web search

2. **Clone & Install**:
   ```bash
   git clone <repo-url>
   cd riskguard-ai-myfv3wna5cgaeabqnz55s
   bun install
   ```

3. **Configure Environment** (`wrangler.jsonc`):
   Update `vars`:
   ```json
   {
     "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai",
     "CF_AI_API_KEY": "your-gateway-token",
     "SERPAPI_KEY": "your-serpapi-key"  // Optional for web search
   }
   ```

4. **Generate Types**:
   ```bash
   bun run cf-typegen
   ```

5. **Development**:
   ```bash
   bun dev
   ```
   Open `http://localhost:8787` (or `PORT=3000 bun dev`).

## 🧪 Usage Examples

### Chat Sessions
- **List Sessions**: `GET /api/sessions`
- **Create Session**: `POST /api/sessions` `{ "title": "My Chat", "firstMessage": "Hello" }`
- **Delete Session**: `DELETE /api/sessions/{sessionId}`
- **Rename**: `PUT /api/sessions/{sessionId}/title` `{ "title": "New Name" }`

### Chat API
All chat ops under `/api/chat/{sessionId}`:
- **Send Message**: `POST /chat` `{ "message": "What's the weather in NYC?", "stream": true }`
- **Get State**: `GET /messages`
- **Clear Chat**: `DELETE /clear`
- **Change Model**: `POST /model` `{ "model": "google-ai-studio/gemini-2.5-pro" }`

Frontend handles sessions via `chatService` in `src/lib/chat.ts`.

## 🔧 Development

- **Frontend**: `cd src && bun dev` (or full `bun dev`)
- **Worker**: Edit `worker/` files. Core routes in `userRoutes.ts`.
- **Add Tools**: Extend `worker/tools.ts` or MCP servers in `worker/mcp-client.ts`.
- **Custom Routes**: Add to `worker/userRoutes.ts` (userRoutes function).
- **UI Components**: shadcn/ui ready (`npx shadcn-ui@latest add <component>`).
- **Lint & Build**: `bun lint`, `bun build`.
- **Preview**: `bun preview`.

Hot reload works for both FE/BE. Workers types auto-generated.

## 🚀 Deployment

1. **Login to Cloudflare**:
   ```bash
   bunx wrangler login
   ```

2. **Deploy**:
   ```bash
   bun run deploy
   ```
   Or one-click:

   [![[cloudflarebutton]]](https://workers.cloudflare.com)

3. **Custom Domain** (optional):
   ```bash
   wrangler pages deploy --project-name <name> --branch main
   ```

4. **Environment Vars**: Set via Wrangler dashboard or CLI:
   ```bash
   wrangler secret put SERPAPI_KEY
   ```

Durable Objects auto-migrate via `wrangler.jsonc`. Assets served as SPA.

## 🤝 Contributing

1. Fork & PR.
2. Follow TypeScript/best practices.
3. Test changes: `bun dev`.
4. Update README for new features.

## 📄 License

MIT. See [LICENSE](LICENSE) for details.

## 🙌 Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Agents SDK](https://developers.cloudflare.com/agents/)
- [AI Gateway](https://developers.cloudflare.com/ai-gateway/)

Built with ❤️ for Cloudflare Developers. Issues? [Open one](https://github.com/cloudflare/templates/issues/new).