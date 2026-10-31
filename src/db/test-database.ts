import type { SQLiteDatabase } from 'expo-sqlite';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

/**
 * An in-memory database for tests: Node's built-in SQLite behind the part of expo-sqlite's API the
 * app uses, so schema.ts and repo.ts run their real SQL. Add a method here when the app starts
 * using a new one.
 */
export function openTestDatabase(): SQLiteDatabase {
  const db = new DatabaseSync(':memory:');

  const transaction = <T>(task: () => T): T => {
    db.exec('BEGIN');
    try {
      const result = task();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  const adapter = {
    execSync: (sql: string) => db.exec(sql),
    execAsync: async (sql: string) => db.exec(sql),
    getFirstAsync: async (sql: string, ...params: SQLInputValue[]) => db.prepare(sql).get(...params) ?? null,
    getAllSync: (sql: string, ...params: SQLInputValue[]) => db.prepare(sql).all(...params),
    runSync: (sql: string, ...params: SQLInputValue[]) => {
      const { changes, lastInsertRowid } = db.prepare(sql).run(...params);
      return { changes: Number(changes), lastInsertRowId: Number(lastInsertRowid) };
    },
    prepareSync: (sql: string) => {
      const statement = db.prepare(sql);
      return {
        executeSync: (...params: SQLInputValue[]) => {
          statement.run(...params);
        },
        finalizeSync: () => {},
      };
    },
    withTransactionSync: transaction,
    withExclusiveTransactionAsync: async (task: (tx: unknown) => Promise<void>) => {
      db.exec('BEGIN EXCLUSIVE');
      try {
        await task(adapter);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return adapter as unknown as SQLiteDatabase;
}
