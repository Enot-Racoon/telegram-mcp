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
| `get_messages` | Get messages from a chat (limit, offset, before_id, after_id) |
| `send_message` | Send a message (reply_to, parse_mode, disable_link_preview) |
| `mark_as_read` | Mark messages in a chat as read |
| `get_chat_info` | Get detailed chat info (type, id, participants, last/pinned message) |

### Search & Resolve

| Tool | Description |
|------|-------------|
| `search_chats` | Search chats by title or username |
| `resolve_chat` | Convert @username, t.me/link, or raw ID to internal chat_id |
| `search_messages` | Search messages by text (per chat or globally, with filters) |

### Message Actions

| Tool | Description |
|------|-------------|
| `reply_to_message` | Send a reply to a specific message |
| `edit_message` | Edit the text of an existing message |
| `delete_message` | Delete a message from a chat |

### Updates & Unread

| Tool | Description |
|------|-------------|
| `get_unread_messages` | Get unread messages (from specific chat or all chats) |
| `get_updates_since` | Get new messages since a specific message ID (incremental updates) |

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

## Usage Examples

### Search and Resolve Chats

```json
// Search for a chat by username
{
  "name": "search_chats",
  "arguments": { "query": "project", "limit": 5 }
}

// Resolve a username to chat_id
{
  "name": "resolve_chat",
  "arguments": { "ref": "@my_channel" }
}

// Resolve a t.me link
{
  "name": "resolve_chat",
  "arguments": { "ref": "t.me/my_channel" }
}
```

### Search Messages

```json
// Search messages globally
{
  "name": "search_messages",
  "arguments": { "query": "meeting", "limit": 10 }
}

// Search within a specific chat
{
  "name": "search_messages",
  "arguments": {
    "query": "deadline",
    "chatId": "chat-123",
    "limit": 20
  }
}

// Search with date filter
{
  "name": "search_messages",
  "arguments": {
    "query": "report",
    "minDate": 1709251200000,
    "maxDate": 1709337600000
  }
}
```

### Message Actions

```json
// Reply to a message
{
  "name": "reply_to_message",
  "arguments": {
    "chatId": "chat-123",
    "messageId": "msg-456",
    "text": "Got it, thanks!"
  }
}

// Edit a message
{
  "name": "edit_message",
  "arguments": {
    "chatId": "chat-123",
    "messageId": "msg-456",
    "newText": "Updated content"
  }
}

// Delete a message
{
  "name": "delete_message",
  "arguments": {
    "chatId": "chat-123",
    "messageId": "msg-456"
  }
}
```

### Get Updates and Unread

```json
// Get unread messages from all chats
{
  "name": "get_unread_messages",
  "arguments": { "limit": 50 }
}

// Get unread from specific chat
{
  "name": "get_unread_messages",
  "arguments": { "chatId": "chat-123", "limit": 20 }
}

// Get updates since last known message
{
  "name": "get_updates_since",
  "arguments": {
    "chatId": "chat-123",
    "afterMessageId": "msg-789",
    "limit": 50
  }
}
```

### Enhanced Get Messages

```json
// Get messages with pagination
{
  "name": "get_messages",
  "arguments": {
    "chatId": "chat-123",
    "limit": 20,
    "offset": 40
  }
}

// Get messages before a specific ID
{
  "name": "get_messages",
  "arguments": {
    "chatId": "chat-123",
    "beforeId": "msg-100",
    "limit": 50
  }
}

// Get messages after a specific ID (for loading new messages)
{
  "name": "get_messages",
  "arguments": {
    "chatId": "chat-123",
    "afterId": "msg-50",
    "limit": 50
  }
}
```

### Enhanced Send Message

```json
// Send with reply
{
  "name": "send_message",
  "arguments": {
    "chatId": "chat-123",
    "text": "Sure!",
    "replyToMessageId": "msg-456"
  }
}

// Send with markdown
{
  "name": "send_message",
  "arguments": {
    "chatId": "chat-123",
    "text": "**Bold** and _italic_",
    "parseMode": "markdown"
  }
}

// Send without link preview
{
  "name": "send_message",
  "arguments": {
    "chatId": "chat-123",
    "text": "Check this: https://example.com",
    "disableLinkPreview": true
  }
}
```

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
- **Chat operations** (list_chats, get_messages, send_message, mark_as_read, get_chat_info)
- **Search & Resolve** (search_chats, resolve_chat, search_messages)
- **Message actions** (reply_to_message, edit_message, delete_message)
- **Updates & Unread** (get_unread_messages, get_updates_since)
- **Account management** (list_accounts, set_default_account, switch_account)
- **Authentication** (login_start, login_submit_code, login_submit_password, logout)
- **Status tools** (is_logged_in, get_auth_status, get_me, is_authenticated)

### Stage 2 - Real Integration
- MTProto implementation
- Real Telegram API connection
- Authentication flow with real codes
- Real message sending/receiving

### Stage 3 - Enhanced Tools
- forward_message tool
- send_media tool (photo, video, document)
- send_voice_message tool
- pin_message / unpin_message tools
- get_chat_members tool
- export_chat_invite_link tool

### Stage 4 - Production Ready
- Error recovery and retry logic
- Rate limiting and throttling
- Connection pooling
- Monitoring and metrics
- Webhook support for real-time updates

## License

MIT
