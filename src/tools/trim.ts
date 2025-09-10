import { TrimCompressor } from 'slimcontext';
import {
  TrimMessagesArgsSchema,
  SlimContextError,
  MCPToolResult,
} from '../types/index.js';

export async function handleTrimMessages(
  args: unknown
): Promise<MCPToolResult> {
  try {
    const validatedArgs = TrimMessagesArgsSchema.parse(args);

    const trimCompressor = new TrimCompressor({
      maxModelTokens: validatedArgs.maxModelTokens,
      thresholdPercent: validatedArgs.thresholdPercent,
      minRecentMessages: validatedArgs.minRecentMessages,
    });

    const compressedMessages = await trimCompressor.compress(
      validatedArgs.messages.map((msg) => ({
        ...msg,
        role: msg.role === 'human' ? ('user' as const) : msg.role,
      }))
    );

    const originalCount = validatedArgs.messages.length;
    const compressedCount = compressedMessages.length;
    const removedCount = originalCount - compressedCount;

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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
              error_type:
                error instanceof SlimContextError
                  ? 'SlimContextError'
                  : 'UnknownError',
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
