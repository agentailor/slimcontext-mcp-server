import { SummarizeCompressor } from 'slimcontext';
import OpenAI from 'openai';
import {
  SummarizeMessagesArgsSchema,
  SlimContextError,
  OpenAIError,
  MCPToolResult,
  SlimContextMessage,
} from '../types/index.js';

class OpenAISlimContextModel {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async invoke(messages: SlimContextMessage[]) {
    try {
      const openaiMessages = messages.map((msg) => ({
        role:
          msg.role === 'human'
            ? ('user' as const)
            : msg.role === 'tool'
              ? ('assistant' as const)
              : (msg.role as 'system' | 'user' | 'assistant'),
        content: msg.content,
      }));

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        temperature: 0.1,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new OpenAIError('No content returned from OpenAI API');
      }

      return { content };
    } catch (error) {
      if (error instanceof OpenAIError) {
        throw error;
      }
      throw new OpenAIError(
        `OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }
}

export async function handleSummarizeMessages(
  args: unknown
): Promise<MCPToolResult> {
  try {
    const validatedArgs = SummarizeMessagesArgsSchema.parse(args);

    const apiKey = validatedArgs.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new SlimContextError(
        'OpenAI API key is required. Provide it via openaiApiKey parameter or OPENAI_API_KEY environment variable.'
      );
    }

    const model = new OpenAISlimContextModel(apiKey, validatedArgs.openaiModel);

    const summarizeConfig = {
      model,
      maxModelTokens: validatedArgs.maxModelTokens,
      thresholdPercent: validatedArgs.thresholdPercent,
      minRecentMessages: validatedArgs.minRecentMessages,
      ...(validatedArgs.customPrompt && { prompt: validatedArgs.customPrompt }),
    };

    const summarizeCompressor = new SummarizeCompressor(summarizeConfig);

    const compressedMessages = await summarizeCompressor.compress(
      validatedArgs.messages.map((msg) => ({
        ...msg,
        role: msg.role === 'human' ? ('user' as const) : msg.role,
      }))
    );

    const originalCount = validatedArgs.messages.length;
    const compressedCount = compressedMessages.length;
    const removedCount = originalCount - compressedCount;

    const hasSummary = compressedMessages.some(
      (msg) =>
        msg.role === 'system' &&
        !validatedArgs.messages.some((orig) => orig.content === msg.content)
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              original_message_count: originalCount,
              compressed_message_count: compressedCount,
              messages_removed: removedCount,
              summary_generated: hasSummary,
              compression_ratio: compressedCount / originalCount,
              compressed_messages: compressedMessages,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const errorType =
      error instanceof OpenAIError
        ? 'OpenAIError'
        : error instanceof SlimContextError
          ? 'SlimContextError'
          : 'UnknownError';

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
              error_type: errorType,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
