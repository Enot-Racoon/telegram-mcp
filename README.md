# Telegram MCP Server

A production-ready MCP (Model Context Protocol) server for Telegram integration.

## Stage 1: Foundation

This is the initial foundation stage with:
- ✅ MCP server scaffold with tools
- ✅ Telegram abstraction layer with interface
- ✅ Mock Telegram provider for offline testing
- ✅ SQLite storage layer
- ✅ Cache subsystem
- ✅ Logging subsystem
- ✅ Account/session management
- ✅ CLI behavior (help when not run as MCP)
- ✅ Full TDD setup with Vitest
- ✅ ZERO real Telegram API calls

## Available Tools

### Chat Operations

| Tool | Description |
|------|-------------|
| `list_chats` | List all Telegram chats (filter by type/unread) |
| `get_messages` | Get messages from a specific chat |
| `send_message` | Send a text message to a chat |
| `mark_as_read` | Mark messages in a chat as read |
| `get_chat_info` | Get detailed chat info (type, id, participants, last/pinned message) |

### Account & Auth Operations

| Tool | Description |
|------|-------------|
| `login_start` | Start login process with phone number |
| `login_submit_code` | Submit verification code from Telegram |
| `login_submit_password` | Submit 2FA password if required |
| `logout` | Logout from current Telegram session |
| `list_accounts` | List all Telegram accounts |
| `set_default_account` | Set the default active account |
| `switch_account` | Switch to a different account |
| `is_logged_in` | Check if currently logged in |
| `get_auth_status` | Get detailed authentication status |
| `get_me` | Get information about current account |
| `login` | Legacy login (direct, mock) |
| `is_authenticated` | Legacy auth check (mock) |

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
  getChatInfo(chatId: string): Promise<ChatInfo | null>;
}
```

The `MockTelegramProvider` implements this interface with in-memory data for testing.

### Account Management

The `AccountManager` handles multi-account support:

```typescript
interface AccountManager {
  createAccount(phone: string): Account;
  getAccount(id: string): Account | null;
  getAllAccounts(): Account[];
  getActiveAccounts(): Account[];
  setDefaultAccount(id: string): boolean;
  setDefaultAccountByPhone(phone: string): boolean;
  getAuthStatus(): AuthStatus;
  activateSession(id: string, userId: string): void;
  deactivateSession(id: string): void;
  deleteAccount(id: string): boolean;
}
```

### Auth Flow

The authentication flow supports multi-step login:

1. `login_start(phone)` - Send phone number, receive code
2. `login_submit_code(phone, code)` - Submit verification code
3. `login_submit_password(phone, password)` - Submit 2FA password (if required)
4. Account becomes active and ready for use

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
- Chat operations tools (list_chats, get_messages, send_message, mark_as_read, get_chat_info)
- Account management tools (list_accounts, set_default_account, switch_account)
- Authentication tools (login_start, login_submit_code, login_submit_password, logout)
- Status tools (is_logged_in, get_auth_status, get_me, is_authenticated)

### Stage 2 - Real Integration
- MTProto implementation
- Real Telegram API connection
- Authentication flow with real codes

### Stage 3 - Enhanced Tools
- search_messages tool
- delete_message tool
- edit_message tool
- forward_message tool
- send_media tool

### Stage 4 - Production Ready
- Error recovery
- Rate limiting
- Connection pooling
- Monitoring/metrics

## License

MIT
