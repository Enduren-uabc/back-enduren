import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestLogContext {
  requestId: string;
  method: string;
  path: string;
  actorId?: string;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestLogContext>();

  run<T>(context: RequestLogContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): RequestLogContext | undefined {
    return this.storage.getStore();
  }
}
