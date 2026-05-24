export class ReminderCreatedEvent {
  constructor(
    public readonly reminderId: string,
    public readonly userId: string,
    public readonly dayOfWeek: string,
    public readonly time: string,
    public readonly nextActivationAt: Date,
  ) {}
}
