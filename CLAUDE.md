# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `pnpm build` - Compiles TypeScript to JavaScript in `dist/` directory
- **Development**: `pnpm dev` - Runs the server directly from source using tsx
- **Type checking**: `pnpm typecheck` - Runs TypeScript compiler without emitting files
- **Start production**: `pnpm start` - Runs the compiled server from `dist/index.js`

## Architecture Overview

This is a Model Context Protocol (MCP) server that wraps the SlimContext library to provide AI chat history compression tools. The architecture follows a modular design:

### Core Components

- **`src/index.ts`** - Main server entry point using `@modelcontextprotocol/sdk`
  - `SlimContextMCPServer` class manages the MCP server lifecycle
  - Handles tool registration and request routing
  - Implements proper error handling and graceful shutdown

- **`src/types/index.ts`** - Type definitions and Zod schemas
  - Defines message schemas compatible with SlimContext format
  - Contains validation schemas for tool arguments
  - Custom error classes: `SlimContextError` and `OpenAIError`

### Tool Implementations

- **`src/tools/trim.ts`** - Token-based trimming compression
  - Uses `TrimCompressor` from slimcontext library
  - Removes oldest non-system messages when token threshold exceeded
  - Fast, deterministic, no external dependencies

- **`src/tools/summarize.ts`** - AI-powered summarization compression
  - Uses `SummarizeCompressor` from slimcontext library
  - Custom `OpenAISlimContextModel` adapter for OpenAI API integration
  - Creates summaries of older messages while preserving recent context
  - Requires OpenAI API key via parameter or `OPENAI_API_KEY` environment variable

### Message Format

All tools work with SlimContext message format:

```typescript
{
  role: 'system' | 'user' | 'assistant' | 'tool' | 'human',
  content: string
}
```

The codebase handles role normalization (e.g., 'human' → 'user') when interfacing with external APIs.

### Error Handling Strategy

- Tools return structured JSON responses with success/error states
- Custom error types allow for specific error handling
- MCP server wraps tool errors in standardized format
- All async operations are properly handled with try/catch blocks

### Key Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `slimcontext` - Core compression algorithms
- `openai` - OpenAI API client for summarization
- `zod` - Runtime type validation and parsing

## TypeScript Configuration

Uses strict TypeScript configuration with:

- ES2022 target with ESNext modules
- Strict type checking enabled (`noImplicitAny`, `strictNullChecks`, etc.)
- Source maps and declarations generated
- Output to `dist/` directory
