import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../../trainer-link/domain/repositories/trainer-link.repository.port';
import {
  TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT,
  TrainerAssignedRoutineRepositoryPort,
} from '../../../domain/repositories/trainer-assigned-routine.repository.port';
import {
  NOTIFICATION_REPOSITORY_PORT,
  NotificationRepository,
} from '../../../../training-reminders/domain/repositories/notification.repository.port';
import { InAppNotification } from '../../../../training-reminders/domain/entities/notification.entity';
import { RoutineSnapshot } from '../../../domain/value-objects/routine-snapshot.vo';
import { RoutineDaySnapshot } from '../../../domain/value-objects/routine-day-snapshot.vo';
import { ExerciseSnapshot } from '../../../domain/value-objects/exercise-snapshot.vo';

export interface EditAssignedRoutineContentInput {
  trainerId: string;
  clientId: string;
  assignedId: string;
  name?: string;
  days?: Array<{
    dayOfWeek: string;
    exercises: Array<{
      exerciseId: string;
      name: string;
      sets: number;
      reps: number;
      restSeconds: number;
      order: number;
    }>;
  }>;
}

export interface EditAssignedRoutineContentOutput {
  id: string;
  clientId: string;
  trainerId: string;
  routineId: string;
  routineSnapshot: {
    name: string;
    description: string;
    difficulty: string;
    estimatedDuration: number;
    exercises: Array<{
      exerciseId: string;
      name: string;
      sets: number;
      reps: number;
      restSeconds: number;
      order: number;
    }>;
    days: Array<{
      dayOfWeek: string;
      exercises: Array<{
        exerciseId: string;
        name: string;
        sets: number;
        reps: number;
        restSeconds: number;
        order: number;
      }>;
    }>;
  };
  status: string;
  assignedAt: Date;
  notes: string | null;
}

@Injectable()
export class EditAssignedRoutineContentUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT)
    private readonly assignedRoutineRepository: TrainerAssignedRoutineRepositoryPort,
    @Inject(NOTIFICATION_REPOSITORY_PORT)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    input: EditAssignedRoutineContentInput,
  ): Promise<EditAssignedRoutineContentOutput> {
    const activeLink =
      await this.linkRepository.findActiveByTrainerIdAndClientId(
        input.trainerId,
        input.clientId,
      );
    if (!activeLink) {
      throw new ForbiddenException('No active link with this client');
    }

    const assigned = await this.assignedRoutineRepository.findByIdAndTrainer(
      input.assignedId,
      input.trainerId,
    );
    if (!assigned) {
      throw new NotFoundException('Assigned routine not found');
    }

    if (!assigned.status.isActive()) {
      throw new ForbiddenException('Cannot edit a non-active assigned routine');
    }

    const name = input.name ?? assigned.routineSnapshot.name;
    const days = input.days ?? assigned.routineSnapshot.days;

    this.validateRoutineContent(name, days);

    const daySnapshots = this.buildDaySnapshots(days);
    const exerciseSnapshots = daySnapshots.flatMap((d) => d.exercises);

    const updatedSnapshot = RoutineSnapshot.create({
      routineId: assigned.routineId,
      name: name.trim(),
      description: assigned.routineSnapshot.description,
      difficulty: assigned.routineSnapshot.difficulty,
      estimatedDuration: assigned.routineSnapshot.estimatedDuration,
      exercises: exerciseSnapshots,
      days: daySnapshots,
    });

    const updated = assigned.updateSnapshot(updatedSnapshot);
    const saved = await this.assignedRoutineRepository.save(updated);

    await this.sendUpdateNotification(input.clientId, saved.routineSnapshot.name);

    return this.buildResponse(saved);
  }

  private validateRoutineContent(
    name: string,
    days: Array<{
      dayOfWeek: string;
      exercises: Array<{
        exerciseId: string;
        name: string;
        sets: number;
        reps: number;
        restSeconds: number;
        order: number;
      }>;
    }>,
  ): void {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Routine name cannot be empty');
    }
    if (!days || days.length === 0) {
      throw new BadRequestException('Routine must have at least one day');
    }
    for (const day of days) {
      if (!day.exercises || day.exercises.length === 0) {
        throw new BadRequestException(
          `Day "${day.dayOfWeek}" must have at least one exercise`,
        );
      }
      for (const ex of day.exercises) {
        if (!ex.name || ex.name.trim().length === 0) {
          throw new BadRequestException('Exercise name cannot be empty');
        }
        if (!Number.isInteger(ex.sets) || ex.sets < 1) {
          throw new BadRequestException(
            `Exercise "${ex.name}" must have at least 1 set`,
          );
        }
        if (!Number.isInteger(ex.reps) || ex.reps < 1) {
          throw new BadRequestException(
            `Exercise "${ex.name}" must have at least 1 rep`,
          );
        }
      }
    }
  }

  private buildDaySnapshots(
    days: Array<{
      dayOfWeek: string;
      exercises: Array<{
        exerciseId: string;
        name: string;
        sets: number;
        reps: number;
        restSeconds: number;
        order: number;
      }>;
    }>,
  ): RoutineDaySnapshot[] {
    return days.map((day) =>
      RoutineDaySnapshot.create({
        dayOfWeek: day.dayOfWeek,
        exercises: day.exercises.map((ex) =>
          ExerciseSnapshot.create({
            exerciseId: ex.exerciseId,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
            order: ex.order,
          }),
        ),
      }),
    );
  }

  private async sendUpdateNotification(
    clientId: string,
    routineName: string,
  ): Promise<void> {
    const notification = InAppNotification.create(
      clientId,
      'Rutina actualizada',
      `Tu entrenador ha modificado tu rutina asignada: ${routineName}`,
    );
    await this.notificationRepository.save(notification);
  }

  private buildResponse(
    saved: import('../../../domain/entities/trainer-assigned-routine.entity').TrainerAssignedRoutine,
  ): EditAssignedRoutineContentOutput {
    return {
      id: saved.id,
      clientId: saved.clientId,
      trainerId: saved.trainerId,
      routineId: saved.routineId,
      routineSnapshot: {
        name: saved.routineSnapshot.name,
        description: saved.routineSnapshot.description,
        difficulty: saved.routineSnapshot.difficulty,
        estimatedDuration: saved.routineSnapshot.estimatedDuration,
        exercises: saved.routineSnapshot.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.restSeconds,
          order: e.order,
        })),
        days: saved.routineSnapshot.days.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          exercises: d.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            restSeconds: e.restSeconds,
            order: e.order,
          })),
        })),
      },
      status: saved.status.value,
      assignedAt: saved.assignedAt,
      notes: saved.notes,
    };
  }
}
