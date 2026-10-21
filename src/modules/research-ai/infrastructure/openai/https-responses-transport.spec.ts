// Created by: Codex (AI-assisted), 2026-10-20
import { EventEmitter } from 'node:events';
import { ClientRequest, IncomingMessage } from 'node:http';
import * as https from 'node:https';
import {
  HttpsResponsesTransport,
  ResponsesTransportRequest,
} from './https-responses-transport';

jest.mock('node:https', () => ({
  request: jest.fn(() => {
    throw new Error('NETWORK_FORBIDDEN_IN_OFFLINE_TEST');
  }),
}));

function fixture() {
  const request = Object.assign(new EventEmitter(), {
    end: jest.fn(),
    destroy: jest.fn(),
  });
  const response = Object.assign(new EventEmitter(), {
    statusCode: 200,
    headers: { 'x-request-id': 'request-offline' },
    destroy: jest.fn(),
  });
  let receive: ((response: IncomingMessage) => void) | undefined;
  const dispatch = jest.fn(
    (
      options: https.RequestOptions,
      callback: (response: IncomingMessage) => void,
    ) => {
      receive = callback;
      return request as unknown as ClientRequest;
    },
  );
  const transport = new HttpsResponsesTransport(
    dispatch as unknown as typeof https.request,
  );
  const input: ResponsesTransportRequest = {
    body: '{"text":"ñ"}',
    credential: 'ephemeral-marker',
    maxResponseBytes: 100,
    timeoutMs: 1000,
    beforeDispatch: () => true,
  };
  return {
    request,
    response,
    dispatch,
    transport,
    input,
    receive: () => receive!(response as unknown as IncomingMessage),
  };
}

describe('node HTTPS Responses transport with injected request, no sockets', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    expect(https.request).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
    jest.useRealTimers();
  });
  it('uses exactly one fixed HTTPS POST and counts UTF-8 request bytes', async () => {
    const f = fixture();
    const result = f.transport.send(f.input);
    expect(f.dispatch).toHaveBeenCalledTimes(1);
    expect(f.dispatch.mock.calls[0][0]).toEqual({
      protocol: 'https:',
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/responses',
      method: 'POST',
      agent: false,
      headers: {
        Authorization: 'Bearer ephemeral-marker',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(f.input.body),
        'Accept-Encoding': 'identity',
      },
    });
    expect(f.request.end).toHaveBeenCalledWith(f.input.body);
    f.receive();
    const bytes = Buffer.from('á🙂');
    f.response.emit('data', bytes.subarray(0, 3));
    f.response.emit('data', bytes.subarray(3));
    f.response.emit('end');
    expect(await result).toEqual({
      kind: 'RESPONSE',
      status: 200,
      requestId: 'request-offline',
      body: 'á🙂',
    });
    expect(f.request.destroy).not.toHaveBeenCalled();
  });
  it.each([301, 401, 429, 500, 503])(
    'returns HTTP %i once without retry or redirect',
    async (status) => {
      const f = fixture();
      f.response.statusCode = status;
      const result = f.transport.send(f.input);
      f.receive();
      f.response.emit('data', Buffer.from('provider error details'));
      f.response.emit('end');
      expect(await result).toMatchObject({ kind: 'RESPONSE', status });
      jest.advanceTimersByTime(10_000);
      expect(f.dispatch).toHaveBeenCalledTimes(1);
    },
  );
  it.each(['cancelled', 'disabled', 'throws', 'cancelled-during-check'])(
    'blocks %s before constructing HTTP',
    async (mode) => {
      const f = fixture();
      const controller = new AbortController();
      if (mode === 'cancelled') controller.abort();
      const beforeDispatch = jest.fn(() => {
        if (mode === 'throws') throw new Error('private detail');
        if (mode === 'cancelled-during-check') controller.abort();
        return mode !== 'disabled';
      });
      expect(
        await f.transport.send({
          ...f.input,
          signal: controller.signal,
          beforeDispatch,
        }),
      ).toEqual({
        kind: 'NOT_SENT',
        reason: mode.startsWith('cancelled') ? 'CANCELLED' : 'DISABLED',
      });
      expect(f.dispatch).not.toHaveBeenCalled();
      if (mode === 'cancelled') expect(beforeDispatch).not.toHaveBeenCalled();
    },
  );
  it.each([
    'cancelled',
    'timeout',
    'request-error',
    'response-error',
    'aborted',
  ])('retains uncertainty after %s during dispatch', async (mode) => {
    const f = fixture();
    const controller = new AbortController();
    const remove = jest.spyOn(controller.signal, 'removeEventListener');
    const result = f.transport.send({ ...f.input, signal: controller.signal });
    f.receive();
    f.response.emit('data', Buffer.from('partial'));
    if (mode === 'cancelled') controller.abort();
    else if (mode === 'timeout') jest.advanceTimersByTime(1000);
    else if (mode === 'request-error')
      f.request.emit('error', new Error('private detail'));
    else if (mode === 'response-error')
      f.response.emit('error', new Error('private detail'));
    else f.response.emit('aborted');
    const reason =
      mode === 'cancelled'
        ? 'CANCELLED'
        : mode === 'timeout'
          ? 'TIMEOUT'
          : 'NETWORK_ERROR';
    expect(await result).toEqual({ kind: 'UNCERTAIN', reason });
    expect(f.request.destroy).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
    f.response.emit('end');
    expect(f.dispatch).toHaveBeenCalledTimes(1);
  });
  it('treats construction failure as uncertain and never retries', async () => {
    const f = fixture();
    f.dispatch.mockImplementation(() => {
      throw new Error('private detail');
    });
    expect(await f.transport.send(f.input)).toEqual({
      kind: 'UNCERTAIN',
      reason: 'NETWORK_ERROR',
    });
    expect(f.dispatch).toHaveBeenCalledTimes(1);
  });
  it('does not end the request if aborted while constructing it', async () => {
    const f = fixture();
    const controller = new AbortController();
    f.dispatch.mockImplementation(() => {
      controller.abort();
      return f.request as unknown as ClientRequest;
    });
    expect(
      await f.transport.send({ ...f.input, signal: controller.signal }),
    ).toEqual({ kind: 'UNCERTAIN', reason: 'CANCELLED' });
    expect(f.request.end).not.toHaveBeenCalled();
    expect(f.request.destroy).toHaveBeenCalledTimes(1);
  });
  it.each([3, 4])(
    'enforces response cap on bytes, limit %i',
    async (maxResponseBytes) => {
      const f = fixture();
      const result = f.transport.send({ ...f.input, maxResponseBytes });
      f.receive();
      f.response.emit('data', Buffer.from('🙂'));
      f.response.emit('end');
      expect(await result).toEqual(
        maxResponseBytes === 3
          ? { kind: 'UNCERTAIN', reason: 'RESPONSE_TOO_LARGE' }
          : {
              kind: 'RESPONSE',
              status: 200,
              requestId: 'request-offline',
              body: '🙂',
            },
      );
      expect(f.response.destroy).toHaveBeenCalledTimes(
        maxResponseBytes === 3 ? 1 : 0,
      );
    },
  );
  it('drops multiple request-id header values and removes abort listener after success', async () => {
    const f = fixture();
    const controller = new AbortController();
    const remove = jest.spyOn(controller.signal, 'removeEventListener');
    Object.assign(f.response.headers, { 'x-request-id': ['a', 'b'] });
    const result = f.transport.send({ ...f.input, signal: controller.signal });
    f.receive();
    f.response.emit('end');
    expect(await result).toMatchObject({ kind: 'RESPONSE', requestId: null });
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
    controller.abort();
    f.response.emit('error', new Error('late error'));
    f.request.emit('error', new Error('late error'));
    expect(f.request.destroy).not.toHaveBeenCalled();
  });
});
