// Created by: Codex (AI-assisted), 2026-10-19
import { RunPersistenceError } from '../../domain/generation-run';

/** ORM errors carry SQL and bound payloads. Expose only a fixed code and optional SQLSTATE. */
export async function storageBoundary<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (error instanceof RunPersistenceError) throw error;
    let sqlState: string | undefined;
    if (error !== null && typeof error === 'object' && 'driverError' in error) {
      const driver: unknown = error.driverError;
      if (
        driver !== null &&
        typeof driver === 'object' &&
        'code' in driver &&
        typeof driver.code === 'string' &&
        /^[0-9A-Z]{5}$/.test(driver.code)
      ) {
        sqlState = driver.code;
      }
    }
    throw new RunPersistenceError('STORAGE_FAILURE', sqlState);
  }
}
