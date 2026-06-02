import { Injectable } from '@nestjs/common';

type EventListener = (event: any) => Promise<void> | void;

@Injectable()
export class InMemoryEventBus {
  private readonly listeners = new Map<string, EventListener[]>();

  on(eventName: string, listener: EventListener): void {
    const existing = this.listeners.get(eventName) || [];
    existing.push(listener);
    this.listeners.set(eventName, existing);
  }

  async emit<T>(event: T): Promise<void> {
    const name = (event as any)?.constructor?.name;
    if (!name) return;

    const handlers = this.listeners.get(name) || [];
    await Promise.all(handlers.map((h) => Promise.resolve(h(event))));
  }
}
