import { InMemoryEventBus } from './in-memory-event-bus';

class TestEvent {
  constructor(public readonly message: string) {}
}

describe('InMemoryEventBus', () => {
  let bus: InMemoryEventBus;

  beforeEach(() => {
    bus = new InMemoryEventBus();
  });

  it('executes listener when event is emitted', async () => {
    const listener = jest.fn();
    bus.on('TestEvent', listener);

    const event = new TestEvent('hello');
    await bus.emit(event);

    expect(listener).toHaveBeenCalledWith(event);
  });

  it('does not throw when emitting without listeners', async () => {
    const event = new TestEvent('no listeners');
    await expect(bus.emit(event)).resolves.not.toThrow();
  });

  it('supports multiple listeners for same event', async () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    bus.on('TestEvent', listener1);
    bus.on('TestEvent', listener2);

    const event = new TestEvent('multi');
    await bus.emit(event);

    expect(listener1).toHaveBeenCalledWith(event);
    expect(listener2).toHaveBeenCalledWith(event);
  });

  it('awaits all listeners before resolving', async () => {
    const order: string[] = [];
    bus.on('TestEvent', async () => {
      await new Promise((r) => setTimeout(r, 10));
      order.push('slow');
    });
    bus.on('TestEvent', async () => {
      order.push('fast');
    });

    await bus.emit(new TestEvent('ordering'));
    expect(order).toContain('slow');
    expect(order).toContain('fast');
  });
});
