# Telegram MCP Server

A production-ready MCP (Model Context Protocol) server for Telegram integration.

## Stage 1: Foundation

This is the initial foundation stage with:
- ✅ MCP server scaffold (no real tools yet)
- ✅ Telegram abstraction layer with interface
- ✅ Mock Telegram provider for offline testing
- ✅ SQLite storage layer
- ✅ Cache subsystem
- ✅ Logging subsystem
- ✅ Account/session management
- ✅ CLI behavior (help when not run as MCP)
- ✅ Full TDD setup with Vitest
- ✅ ZERO real Telegram API calls

## Project Structure

```
telegram-mcp/
├── src/
│   ├── index.ts              # Main entry point with CLI
│   ├── server.ts             # MCP server implementation
│   ├── core/
│   │   ├── config/           # Configuration management
│   │   ├── database/         # SQLite database initialization
│   │   ├── cache/            # Cache manager
│   │   └── logging/          # Structured logging
│   ├── telegram/
│   │   ├── TelegramProvider.ts    # Provider interface
│   │   ├── MockTelegramProvider.ts # Mock implementation
│   │   └── TelegramService.ts      # Service layer
│   ├── accounts/
│   │   └── AccountManager.ts # Account/session management
│   ├── tools/                # MCP tools (future)
│   └── types/                # TypeScript types
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Installation

```bash
npm install
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type check
npm run typecheck
```

## Usage

### As MCP Server

```bash
# Run as MCP server (via stdio)
npm start

# Or directly
node dist/index.js
```

### CLI Help

```bash
# Show help
npm run dev -- --help

# Show version
npm run dev -- --version
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_MCP_DB_PATH` | Path to SQLite database | `~/.telegram-mcp/telegram.db` |
| `TELEGRAM_MCP_LOG_LEVEL` | Log level: debug, info, warn, error | `info` |
| `TELEGRAM_MCP_CACHE_TTL` | Default cache TTL in milliseconds | `3600000` (1 hour) |
| `TELEGRAM_MCP_MAX_LOGS` | Maximum log entries to keep | `10000` |

## Architecture

### Telegram Abstraction

The `TelegramProvider` interface abstracts all Telegram API interactions:

```typescript
interface TelegramProvider {
  login(phone: string): Promise<void>;
  listChats(): Promise<Chat[]>;
  getMessages(chatId: string, limit: number): Promise<Message[]>;
  sendMessage(chatId: string, text: string): Promise<void>;
  logout(): Promise<void>;
  isAuthenticated(): boolean;
  getCurrentUser(): Promise<UserInfo | null>;
}
```

The `MockTelegramProvider` implements this interface with in-memory data for testing.

### Database Schema

SQLite tables:
- `sessions` - Account sessions
- `cache` - Key-value cache with TTL
- `logs` - Structured operation logs
- `config` - Configuration storage
- `stats` - Metrics and statistics

### Cache System

Features:
- TTL-based expiration
- Prefix-based clearing
- Statistics tracking
- Automatic cleanup

### Logging System

Features:
- Structured JSON logging
- SQLite storage
- Level-based filtering
- Tool execution tracking
- Error logging with context

## Testing

All tests use the mock provider - no network access required.

```bash
# Run all tests
npm test

# Run specific test file
npx vitest tests/unit/MockTelegramProvider.test.ts

# Run with coverage
npm run test:coverage
```

## Roadmap

### Stage 1 (Current) - Foundation ✅
- Core architecture and interfaces
- Mock provider for testing
- Database, cache, logging subsystems

### Stage 2 - Real Integration
- MTProto implementation
- Real Telegram API connection
- Authentication flow

### Stage 3 - MCP Tools
- list_chats tool
- get_messages tool
- send_message tool
- search_messages tool

### Stage 4 - Production Ready
- Error recovery
- Rate limiting
- Connection pooling
- Monitoring/metrics

## License

MIT
