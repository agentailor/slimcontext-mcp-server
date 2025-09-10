import { z } from 'zod';
import type { SlimContextMessage as SlimMessage } from 'slimcontext';

export const SlimContextMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool', 'human']),
  content: z.string(),
});

export const TokenEstimatorSchema = z
  .function()
  .args(SlimContextMessageSchema)
  .returns(z.number())
  .optional();

export const TokenBudgetConfigSchema = z.object({
  maxModelTokens: z.number().min(1).optional().default(8192),
  thresholdPercent: z.number().min(0).max(1).optional().default(0.7),
  minRecentMessages: z.number().min(0).optional(),
  estimateTokens: TokenEstimatorSchema,
});

export const TrimMessagesArgsSchema = z.object({
  messages: z.array(SlimContextMessageSchema).min(1),
  maxModelTokens: z.number().min(1).optional().default(8192),
  thresholdPercent: z.number().min(0).max(1).optional().default(0.7),
  minRecentMessages: z.number().min(0).optional().default(2),
});

export const SummarizeMessagesArgsSchema = z.object({
  messages: z.array(SlimContextMessageSchema).min(1),
  maxModelTokens: z.number().min(1).optional().default(8192),
  thresholdPercent: z.number().min(0).max(1).optional().default(0.7),
  minRecentMessages: z.number().min(0).optional().default(4),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().optional().default('gpt-5-mini'),
  customPrompt: z.string().optional(),
});

export type SlimContextMessage = SlimMessage;
export type TokenBudgetConfig = z.infer<typeof TokenBudgetConfigSchema>;
export type TrimMessagesArgs = z.infer<typeof TrimMessagesArgsSchema>;
export type SummarizeMessagesArgs = z.infer<typeof SummarizeMessagesArgsSchema>;

// Interface for tool result format (used internally by handlers)
export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export class SlimContextError extends Error {
  public override cause?: Error | undefined;

  constructor(message: string, cause?: Error | undefined) {
    super(message);
    this.name = 'SlimContextError';
    this.cause = cause;
  }
}

export class OpenAIError extends SlimContextError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'OpenAIError';
  }
}
