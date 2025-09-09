# SlimContext MCP Server

A Model Context Protocol (MCP) server that wraps the [SlimContext](https://www.npmjs.com/package/slimcontext) library, providing AI chat history compression tools for MCP-compatible clients.

## Overview

SlimContext MCP Server exposes two powerful compression strategies as MCP tools:

1. **`trim-messages`** - Token-based compression that removes oldest messages when exceeding token thresholds
2. **`summarize-messages`** - AI-powered compression using OpenAI to create concise summaries

## Installation

```bash
npm install -g slimcontext-mcp-server
# or
pnpm add -g slimcontext-mcp-server
```

## Development

```bash
# Clone and setup
git clone <repository>
cd slimcontext-mcp-server
pnpm install

# Build
pnpm build

# Run in development
pnpm dev

# Type checking
pnpm typecheck
```

## Configuration

### MCP Client Setup

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "slimcontext": {
      "command": "slimcontext-mcp-server"
    }
  }
}
```

### Environment Variables

- `OPENAI_API_KEY`: OpenAI API key for summarization (optional, can be passed as tool parameter)

## Tools

### trim-messages

Compresses chat history using token-based trimming strategy.

**Parameters:**
- `messages` (required): Array of chat messages
- `maxModelTokens` (optional): Maximum model token context window (default: 8192)
- `thresholdPercent` (optional): Percentage threshold to trigger compression 0-1 (default: 0.7)
- `minRecentMessages` (optional): Minimum recent messages to preserve (default: 2)

**Example:**
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"},
    {"role": "assistant", "content": "Hi there! How can I help you today?"},
    {"role": "user", "content": "Tell me about AI."}
  ],
  "maxModelTokens": 4000,
  "thresholdPercent": 0.8,
  "minRecentMessages": 2
}
```

**Response:**
```json
{
  "success": true,
  "original_message_count": 4,
  "compressed_message_count": 3,
  "messages_removed": 1,
  "compression_ratio": 0.75,
  "compressed_messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "assistant", "content": "Hi there! How can I help you today?"},
    {"role": "user", "content": "Tell me about AI."}
  ]
}
```

### summarize-messages

Compresses chat history using AI-powered summarization strategy.

**Parameters:**
- `messages` (required): Array of chat messages
- `maxModelTokens` (optional): Maximum model token context window (default: 8192)
- `thresholdPercent` (optional): Percentage threshold to trigger compression 0-1 (default: 0.7)
- `minRecentMessages` (optional): Minimum recent messages to preserve (default: 4)
- `openaiApiKey` (optional): OpenAI API key (can also use OPENAI_API_KEY env var)
- `openaiModel` (optional): OpenAI model for summarization (default: 'gpt-4o-mini')
- `customPrompt` (optional): Custom summarization prompt

**Example:**
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "I want to build a web scraper."},
    {"role": "assistant", "content": "I can help you build a web scraper! What programming language would you prefer?"},
    {"role": "user", "content": "Python please."},
    {"role": "assistant", "content": "Great choice! For Python web scraping, I recommend using requests and BeautifulSoup..."},
    {"role": "user", "content": "Can you show me a simple example?"}
  ],
  "maxModelTokens": 4000,
  "thresholdPercent": 0.6,
  "minRecentMessages": 2,
  "openaiModel": "gpt-4o-mini"
}
```

**Response:**
```json
{
  "success": true,
  "original_message_count": 6,
  "compressed_message_count": 4,
  "messages_removed": 2,
  "summary_generated": true,
  "compression_ratio": 0.67,
  "compressed_messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "system", "content": "The user expressed interest in building a web scraper and requested help with Python. The assistant recommended using requests and BeautifulSoup libraries for Python web scraping."},
    {"role": "assistant", "content": "Great choice! For Python web scraping, I recommend using requests and BeautifulSoup..."},
    {"role": "user", "content": "Can you show me a simple example?"}
  ]
}
```

## Message Format

Both tools expect messages in SlimContext format:

```typescript
interface SlimContextMessage {
  role: 'system' | 'user' | 'assistant' | 'tool' | 'human';
  content: string;
}
```

## Error Handling

All tools return structured error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "error_type": "SlimContextError" | "OpenAIError" | "UnknownError"
}
```

Common error scenarios:
- Missing OpenAI API key for summarization
- Invalid message format
- OpenAI API rate limits or errors
- Invalid parameter values

## Token Estimation

SlimContext uses a simple heuristic for token estimation: `Math.ceil(content.length / 4) + 2`. This provides a reasonable approximation for most use cases. For more accurate token counting, you would need to implement a custom token estimator in your client application.

## Compression Strategies

### Trimming Strategy
- Preserves all system messages
- Preserves the most recent N messages
- Removes oldest non-system messages until under token threshold
- Fast and deterministic
- No external API dependencies

### Summarization Strategy  
- Preserves all system messages
- Preserves the most recent N messages
- Summarizes middle portion of conversation using AI
- Creates contextually rich summaries
- Requires OpenAI API access

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Related

- [SlimContext](https://www.npmjs.com/package/slimcontext) - The underlying compression library
- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - TypeScript SDK for MCP