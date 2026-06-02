export class ReminderDueEvent {
  constructor(
    public readonly reminderId: string,
    public readonly userId: string,
    public readonly routineName: string,
    public readonly dayOfWeek: string,
  ) {}
}
