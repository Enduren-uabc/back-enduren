// Created by: Codex (AI-assisted), 2026-10-20
import * as https from 'node:https';

export interface ResponsesTransportRequest {
  readonly body: string;
  readonly credential: string;
  readonly maxResponseBytes: number;
  readonly timeoutMs: number;
  readonly signal?: AbortSignal;
  /** Called synchronously immediately before constructing the only HTTP request. */
  readonly beforeDispatch: () => boolean;
}
export type TransportResult =
  | {
      readonly kind: 'RESPONSE';
      readonly status: number;
      readonly requestId: string | null;
      readonly body: string;
    }
  | { readonly kind: 'NOT_SENT'; readonly reason: 'CANCELLED' | 'DISABLED' }
  | {
      readonly kind: 'UNCERTAIN';
      readonly reason:
        | 'CANCELLED'
        | 'TIMEOUT'
        | 'NETWORK_ERROR'
        | 'RESPONSE_TOO_LARGE';
    };
export interface ResponsesTransport {
  readonly live: boolean;
  send(request: ResponsesTransportRequest): Promise<TransportResult>;
}
/** Fixed destination; no redirects, retries, proxy discovery, SDK, or environment reads. */
export class HttpsResponsesTransport implements ResponsesTransport {
  readonly live = true;
  constructor(private readonly request: typeof https.request = https.request) {}

  send(input: ResponsesTransportRequest): Promise<TransportResult> {
    return new Promise((resolve) => {
      if (input.signal?.aborted) {
        resolve({ kind: 'NOT_SENT', reason: 'CANCELLED' });
        return;
      }
      try {
        if (!input.beforeDispatch()) {
          resolve({ kind: 'NOT_SENT', reason: 'DISABLED' });
          return;
        }
      } catch {
        resolve({ kind: 'NOT_SENT', reason: 'DISABLED' });
        return;
      }
      if (input.signal?.aborted) {
        resolve({ kind: 'NOT_SENT', reason: 'CANCELLED' });
        return;
      }
      let settled = false;
      let req: ReturnType<typeof https.request> | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = (result: TransportResult) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        input.signal?.removeEventListener('abort', onAbort);
        resolve(result);
      };
      const stop = (
        reason:
          | 'CANCELLED'
          | 'TIMEOUT'
          | 'NETWORK_ERROR'
          | 'RESPONSE_TOO_LARGE',
      ) => {
        if (settled) return;
        finish({ kind: 'UNCERTAIN', reason });
        req?.destroy();
      };
      const onAbort = () => stop('CANCELLED');
      try {
        req = this.request(
          {
            protocol: 'https:',
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/responses',
            method: 'POST',
            agent: false,
            headers: {
              Authorization: `Bearer ${input.credential}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(input.body),
              'Accept-Encoding': 'identity',
            },
          },
          (res) => {
            const chunks: Buffer[] = [];
            let bytes = 0;
            res.on('data', (chunk: Buffer) => {
              if (settled) return;
              bytes += chunk.length;
              if (bytes > input.maxResponseBytes) {
                stop('RESPONSE_TOO_LARGE');
                res.destroy();
                return;
              }
              chunks.push(chunk);
            });
            res.on('error', () => stop('NETWORK_ERROR'));
            res.on('aborted', () => stop('NETWORK_ERROR'));
            res.on('end', () =>
              finish({
                kind: 'RESPONSE',
                status: res.statusCode ?? 0,
                requestId:
                  typeof res.headers['x-request-id'] === 'string'
                    ? res.headers['x-request-id']
                    : null,
                body: Buffer.concat(chunks).toString('utf8'),
              }),
            );
          },
        );
        req.on('error', () => stop('NETWORK_ERROR'));
        input.signal?.addEventListener('abort', onAbort, { once: true });
        if (input.signal?.aborted) {
          onAbort();
          return;
        }
        timer = setTimeout(() => stop('TIMEOUT'), input.timeoutMs);
        req.end(input.body);
      } catch {
        // Request construction may have begun dispatch; conservatively retain reservation.
        stop('NETWORK_ERROR');
      }
    });
  }
}
