export class ReminderDeletedEvent {
  constructor(
    public readonly reminderId: string,
    public readonly userId: string,
  ) {}
}
