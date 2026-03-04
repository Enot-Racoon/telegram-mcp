/**
 * Database adapter interface
 * Abstracts raw database operations for testability
 */
export interface DatabaseAdapter {
  /**
   * Execute a SQL statement
   */
  run(sql: string, params?: unknown[]): void;

  /**
   * Execute a SQL query and return single row
   */
  get<T>(sql: string, params?: unknown[]): T | undefined;

  /**
   * Execute a SQL query and return all rows
   */
  all<T>(sql: string, params?: unknown[]): T[];

  /**
   * Execute operations in a transaction
   */
  transaction<T>(fn: () => T): T;

  /**
   * Close the database connection
   */
  close(): void;
}
