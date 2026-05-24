import { Injectable } from '@nestjs/common';

interface OAuthStateEntry {
  returnTo: string;
  createdAt: Date;
}

@Injectable()
export class OAuthStateStore {
  private readonly store = new Map<string, OAuthStateEntry>();
  private readonly TTL_MS = 10 * 60 * 1000;

  set(state: string, returnTo: string): void {
    this.store.set(state, { returnTo, createdAt: new Date() });
  }

  getAndDelete(state: string): string | null {
    const entry = this.store.get(state);
    if (!entry) return null;
    this.store.delete(state);
    if (Date.now() - entry.createdAt.getTime() > this.TTL_MS) return null;
    return entry.returnTo;
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.createdAt.getTime() > this.TTL_MS) {
        this.store.delete(key);
      }
    }
  }
}
