import { Injectable, OnApplicationShutdown } from '@nestjs/common';

type CommandHandler = (command: any) => Promise<void>;

@Injectable()
export class InMemoryCommandBus implements OnApplicationShutdown {
  private readonly handlers = new Map<string, CommandHandler[]>();
  private readonly pendingJobs: Promise<void>[] = [];

  register(commandName: string, handler: CommandHandler): void {
    const existing = this.handlers.get(commandName) || [];
    existing.push(handler);
    this.handlers.set(commandName, existing);
  }

  publish<T>(command: T): void {
    const name = (command as any)?.constructor?.name;
    if (!name) return;

    const handlers = this.handlers.get(name) || [];

    const job = Promise.resolve().then(async () => {
      await Promise.all(handlers.map((h) => Promise.resolve(h(command))));
    });
    this.pendingJobs.push(job);

    job.finally(() => {
      const idx = this.pendingJobs.indexOf(job);
      if (idx >= 0) this.pendingJobs.splice(idx, 1);
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.allSettled(this.pendingJobs);
  }
}
