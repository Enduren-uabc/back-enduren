import { InMemoryCommandBus } from './in-memory-command-bus';

class TestCommand {
  constructor(public readonly value: string) {}
}

describe('InMemoryCommandBus', () => {
  let bus: InMemoryCommandBus;

  beforeEach(() => {
    bus = new InMemoryCommandBus();
  });

  it('executes handler when command is published', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    bus.register('TestCommand', handler);

    const command = new TestCommand('test');
    bus.publish(command);

    await new Promise(process.nextTick);
    expect(handler).toHaveBeenCalledWith(command);
  });

  it('does not throw when publishing without handlers', () => {
    const command = new TestCommand('test');
    expect(() => bus.publish(command)).not.toThrow();
  });

  it('supports multiple handlers for same command', async () => {
    const handler1 = jest.fn().mockResolvedValue(undefined);
    const handler2 = jest.fn().mockResolvedValue(undefined);
    bus.register('TestCommand', handler1);
    bus.register('TestCommand', handler2);

    const command = new TestCommand('multi');
    bus.publish(command);

    await new Promise(process.nextTick);
    expect(handler1).toHaveBeenCalledWith(command);
    expect(handler2).toHaveBeenCalledWith(command);
  });
});
