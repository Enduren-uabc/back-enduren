import { TrainingReminderRepository } from '../../../domain/repositories/training-reminder.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';

export interface ListRemindersOutput {
  id: string;
  routineId: string;
  routineName: string;
  dayOfWeek: string;
  time: string;
  status: string;
  nextActivationAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ListRemindersUseCase {
  constructor(
    private readonly reminderRepository: TrainingReminderRepository,
  ) {}

  public async execute(actor: CurrentActor): Promise<ListRemindersOutput[]> {
    const reminders = await this.reminderRepository.findByUserId(actor.userId);

    return reminders
      .filter((r) => r.status !== 'eliminado')
      .map((r) => ({
        id: r.id,
        routineId: r.routineId,
        routineName: r.routineName,
        dayOfWeek: r.dayOfWeek,
        time: r.time,
        status: r.status,
        nextActivationAt: r.nextActivationAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
  }
}
