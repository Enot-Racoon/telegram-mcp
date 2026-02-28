import type { Chat, Message, User } from '../../types';
import type { TelegramProvider, UserInfo } from './TelegramProvider';

/**
 * Mock Telegram provider for offline testing
 * Uses in-memory fake data with realistic structures
 */
export class MockTelegramProvider implements TelegramProvider {
  private isAuthenticatedFlag = false;
  private currentUser: UserInfo | null = null;
  private simulateError = false;
  private delayMs: number;

  // In-memory storage
  private chats: Map<string, Chat> = new Map();
  private messages: Map<string, Message[]> = new Map();

  constructor(options?: { simulateError?: boolean; delayMs?: number }) {
    this.simulateError = options?.simulateError ?? false;
    this.delayMs = options?.delayMs ?? 50; // Small delay to simulate network
    this.initializeMockData();
  }

  /**
   * Enable/disable error simulation
   */
  setSimulateError(value: boolean): void {
    this.simulateError = value;
  }

  /**
   * Set the simulated delay
   */
  setDelay(ms: number): void {
    this.delayMs = ms;
  }

  private async simulateDelay(): Promise<void> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
  }

  private throwIfError(): void {
    if (this.simulateError) {
      throw new Error('Simulated Telegram API error');
    }
  }

  private initializeMockData(): void {
    // Create mock users
    const users: Record<string, User> = {
      'user-1': {
        id: 'user-1',
        username: 'john_doe',
        firstName: 'John',
        lastName: 'Doe',
        isBot: false,
      },
      'user-2': {
        id: 'user-2',
        username: 'jane_smith',
        firstName: 'Jane',
        lastName: 'Smith',
        isBot: false,
      },
      'bot-1': {
        id: 'bot-1',
        username: 'helper_bot',
        firstName: 'Helper',
        lastName: 'Bot',
        isBot: true,
      },
    };

    // Create mock chats
    const mockChats: Chat[] = [
      {
        id: 'chat-1',
        title: 'John Doe',
        type: 'private',
        username: 'john_doe',
        unreadCount: 2,
        lastMessage: {
          id: 'msg-1',
          chatId: 'chat-1',
          from: users['user-1'],
          text: 'Hey, how are you?',
          timestamp: Date.now() - 3600000,
          isRead: false,
        },
      },
      {
        id: 'chat-2',
        title: 'Project Team',
        type: 'group',
        username: 'project_team',
        unreadCount: 5,
        lastMessage: {
          id: 'msg-2',
          chatId: 'chat-2',
          from: users['user-2'],
          text: 'Meeting at 3pm today',
          timestamp: Date.now() - 7200000,
          isRead: false,
        },
      },
      {
        id: 'chat-3',
        title: 'Tech News',
        type: 'channel',
        username: 'tech_news',
        unreadCount: 0,
        lastMessage: {
          id: 'msg-3',
          chatId: 'chat-3',
          from: users['bot-1'],
          text: 'New TypeScript release available!',
          timestamp: Date.now() - 86400000,
          isRead: true,
        },
      },
    ];

    mockChats.forEach((chat) => this.chats.set(chat.id, chat));

    // Create mock messages for each chat
    this.messages.set('chat-1', [
      {
        id: 'msg-1',
        chatId: 'chat-1',
        from: users['user-1'],
        text: 'Hey, how are you?',
        timestamp: Date.now() - 3600000,
        isRead: false,
      },
      {
        id: 'msg-4',
        chatId: 'chat-1',
        from: users['user-1'],
        text: 'Did you see the new update?',
        timestamp: Date.now() - 7200000,
        isRead: true,
      },
    ]);

    this.messages.set('chat-2', [
      {
        id: 'msg-2',
        chatId: 'chat-2',
        from: users['user-2'],
        text: 'Meeting at 3pm today',
        timestamp: Date.now() - 7200000,
        isRead: false,
      },
      {
        id: 'msg-5',
        chatId: 'chat-2',
        from: users['user-1'],
        text: 'Got it, thanks!',
        timestamp: Date.now() - 10800000,
        isRead: true,
      },
    ]);

    this.messages.set('chat-3', [
      {
        id: 'msg-3',
        chatId: 'chat-3',
        from: users['bot-1'],
        text: 'New TypeScript release available!',
        timestamp: Date.now() - 86400000,
        isRead: true,
      },
    ]);
  }

  async login(phone: string): Promise<void> {
    await this.simulateDelay();
    this.throwIfError();

    // Simulate successful login
    this.isAuthenticatedFlag = true;
    this.currentUser = {
      id: 'current-user',
      phone,
      username: 'mock_user',
      firstName: 'Mock',
      lastName: 'User',
      isBot: false,
    };
  }

  async logout(): Promise<void> {
    await this.simulateDelay();
    this.throwIfError();

    this.isAuthenticatedFlag = false;
    this.currentUser = null;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedFlag;
  }

  async getCurrentUser(): Promise<UserInfo | null> {
    await this.simulateDelay();
    this.throwIfError();

    return this.currentUser;
  }

  async listChats(): Promise<Chat[]> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error('Not authenticated');
    }

    return Array.from(this.chats.values());
  }

  async getMessages(chatId: string, limit: number): Promise<Message[]> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error('Not authenticated');
    }

    const chatMessages = this.messages.get(chatId) || [];
    return chatMessages.slice(0, limit);
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error('Not authenticated');
    }

    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    // Create a new message
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId,
      from: {
        id: 'current-user',
        username: this.currentUser?.username,
        firstName: this.currentUser?.firstName,
        lastName: this.currentUser?.lastName,
        isBot: false,
      },
      text,
      timestamp: Date.now(),
      isRead: true,
    };

    // Add to messages
    const chatMessages = this.messages.get(chatId) || [];
    chatMessages.unshift(newMessage);
    this.messages.set(chatId, chatMessages);

    // Update last message
    chat.lastMessage = newMessage;
  }

  /**
   * Reset mock data to initial state
   */
  reset(): void {
    this.isAuthenticatedFlag = false;
    this.currentUser = null;
    this.initializeMockData();
  }
}
