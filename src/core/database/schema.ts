import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

/**
 * Sessions table - stores Telegram account sessions
 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull().unique(),
  userId: text('user_id').notNull().default(''),
  username: text('username'),
  createdAt: integer('created_at').notNull(),
  lastActiveAt: integer('last_active_at').notNull(),
  isActive: integer('is_active').notNull().default(0),
}, (table) => ({
  phoneIdx: index('sessions_phone_idx').on(table.phone),
  activeIdx: index('sessions_active_idx').on(table.isActive),
}));

/**
 * Cache table - key-value cache with TTL
 */
export const cache = sqliteTable('cache', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at'),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  expiresIdx: index('cache_expires_idx').on(table.expiresAt),
}));

/**
 * Logs table - structured operation logs
 */
export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp').notNull(),
  level: text('level').notNull(),
  tool: text('tool'),
  action: text('action'),
  arguments: text('arguments'),
  result: text('result'),
  error: text('error'),
  duration: integer('duration'),
  sessionId: text('session_id'),
  projectId: text('project_id'),
  serverId: text('server_id'),
  metadata: text('metadata'),
}, (table) => ({
  timestampIdx: index('logs_timestamp_idx').on(table.timestamp),
  levelIdx: index('logs_level_idx').on(table.level),
  sessionIdx: index('logs_session_idx').on(table.sessionId),
  toolIdx: index('logs_tool_idx').on(table.tool),
}));

/**
 * Config table - application configuration
 */
export const config = sqliteTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/**
 * Stats table - metrics and statistics
 */
export const stats = sqliteTable('stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  metricName: text('metric_name').notNull(),
  metricValue: real('metric_value').notNull(),
  timestamp: integer('timestamp').notNull(),
  tags: text('tags'),
}, (table) => ({
  metricIdx: index('stats_metric_idx').on(table.metricName),
  timestampIdx: index('stats_timestamp_idx').on(table.timestamp),
}));

// Export types for use in application
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Cache = typeof cache.$inferSelect;
export type NewCache = typeof cache.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
export type Config = typeof config.$inferSelect;
export type NewConfig = typeof config.$inferInsert;
export type Stat = typeof stats.$inferSelect;
export type NewStat = typeof stats.$inferInsert;
