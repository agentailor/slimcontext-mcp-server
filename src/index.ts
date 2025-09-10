#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { handleTrimMessages } from './tools/trim.js';
import { handleSummarizeMessages } from './tools/summarize.js';
import {
  TrimMessagesArgsSchema,
  SummarizeMessagesArgsSchema,
  SlimContextMessageSchema,
} from './types/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import ru from 'zod/v4/locales/ru.js';

/**
 * SlimContext MCP Server
 *
 * A Model Context Protocol (MCP) server that wraps the SlimContext library,
 * providing AI chat history compression tools for MCP-compatible clients.
 *
 * The server provides tools that enable:
 * - Token-based trimming compression (trim_messages)
 * - AI-powered summarization compression (summarize_messages)
 */

// Export stateless flag for MCP
export const stateless = true;

async function createSlimContextMCPServer() {
  try {
    // Create MCP server
    const server = new McpServer({
      name: 'slimcontext-mcp-server',
      title: 'SlimContext',
      version: '1.0.0',
    });

    console.error('SlimContext MCP Server initialized with modern MCP SDK');

    // Register trim_messages tool
    server.tool(
      'trim_messages',
      'Compress chat message history using token-based trimming strategy. Removes oldest non-system messages when token count exceeds threshold while preserving system messages and recent context.',
      {
        messages: z
          .array(SlimContextMessageSchema)
          .min(1)
          .describe('Array of chat messages to compress'),
        maxModelTokens: z
          .number()
          .min(1)
          .optional()
          .default(8192)
          .describe("Model's maximum token context window"),
        thresholdPercent: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .default(0.7)
          .describe('Percentage threshold to trigger compression (0-1)'),
        minRecentMessages: z
          .number()
          .min(0)
          .optional()
          .default(2)
          .describe('Minimum recent messages to always preserve'),
      },
      async ({
        messages,
        maxModelTokens,
        thresholdPercent,
        minRecentMessages,
      }) => {
        const args = {
          messages,
          maxModelTokens,
          thresholdPercent,
          minRecentMessages,
        };
        const result = await handleTrimMessages(args);
        return result.content[0]?.text
          ? JSON.parse(result.content[0].text)
          : { error: 'No content returned' };
      }
    );

    // Register summarize_messages tool
    server.tool(
      'summarize_messages',
      'Compress chat message history using AI-powered summarization strategy. Creates concise summaries of older messages while preserving system messages and recent context.',
      {
        messages: z
          .array(SlimContextMessageSchema)
          .min(1)
          .describe('Array of chat messages to compress'),
        maxModelTokens: z
          .number()
          .min(1)
          .optional()
          .default(8192)
          .describe("Model's maximum token context window"),
        thresholdPercent: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .default(0.7)
          .describe('Percentage threshold to trigger compression (0-1)'),
        minRecentMessages: z
          .number()
          .min(0)
          .optional()
          .default(4)
          .describe('Minimum recent messages to always preserve'),
        openaiApiKey: z
          .string()
          .optional()
          .describe(
            'OpenAI API key (can also be set via OPENAI_API_KEY environment variable)'
          ),
        openaiModel: z
          .string()
          .optional()
          .default('gpt-4o-mini')
          .describe('OpenAI model to use for summarization'),
        customPrompt: z
          .string()
          .optional()
          .describe('Custom prompt for summarization (optional)'),
      },
      async ({
        messages,
        maxModelTokens,
        thresholdPercent,
        minRecentMessages,
        openaiApiKey,
        openaiModel,
        customPrompt,
      }) => {
        const args = {
          messages,
          maxModelTokens,
          thresholdPercent,
          minRecentMessages,
          openaiApiKey,
          openaiModel,
          customPrompt,
        };
        const result = await handleSummarizeMessages(args);
        return result.content[0]?.text
          ? JSON.parse(result.content[0].text)
          : { error: 'No content returned' };
      }
    );
    // Graceful shutdown logic
    function shutdown() {
      console.log('Shutdown signal received');
      process.exit(0);
    }

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('exit', shutdown);
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
    });
    console.error('SlimContext MCP Server tools registered successfully');

    // const transport = new StdioServerTransport();
    // await server.connect(transport);
    return server;
  } catch (error) {
    console.error(
      `Server initialization error: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

async function main() {
  const transport = new StdioServerTransport();
  const server = await createSlimContextMCPServer();
  await server.connect(transport);
  console.error('Weather MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
