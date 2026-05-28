import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../../trainer-link/domain/repositories/trainer-link.repository.port';
import { ROUTINE_REPOSITORY_PORT } from '../../../../training/application/use-cases/create-routine/create-routine.use-case';
import { RoutineRepository } from '../../../../training/domain/repositories/routine.repository';
import {
  TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT,
  TrainerAssignedRoutineRepositoryPort,
} from '../../../domain/repositories/trainer-assigned-routine.repository.port';
import { TrainerAssignedRoutine } from '../../../domain/entities/trainer-assigned-routine.entity';
import { RoutineSnapshot } from '../../../domain/value-objects/routine-snapshot.vo';
import { ExerciseSnapshot } from '../../../domain/value-objects/exercise-snapshot.vo';
import { RoutineDaySnapshot } from '../../../domain/value-objects/routine-day-snapshot.vo';
import {
  NOTIFICATION_REPOSITORY_PORT,
  NotificationRepository,
} from '../../../../training-reminders/domain/repositories/notification.repository.port';
import { InAppNotification } from '../../../../training-reminders/domain/entities/notification.entity';
import { AssignedRoutineOutput } from '../assign-routine-to-client/assign-routine-to-client.use-case';

export interface ReplaceAssignedRoutineInput {
  trainerId: string;
  clientId: string;
  assignedId: string;
  newRoutineId: string;
  notes?: string;
}

@Injectable()
export class ReplaceAssignedRoutineUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(ROUTINE_REPOSITORY_PORT)
    private readonly routineRepository: RoutineRepository,
    @Inject(TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT)
    private readonly assignedRoutineRepository: TrainerAssignedRoutineRepositoryPort,
    @Inject(NOTIFICATION_REPOSITORY_PORT)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    input: ReplaceAssignedRoutineInput,
  ): Promise<AssignedRoutineOutput> {
    const activeLink =
      await this.linkRepository.findActiveByTrainerIdAndClientId(
        input.trainerId,
        input.clientId,
      );
    if (!activeLink) {
      throw new ForbiddenException('No active link with this client');
    }

    const existing = await this.assignedRoutineRepository.findByIdAndTrainer(
      input.assignedId,
      input.trainerId,
    );
    if (!existing) {
      throw new NotFoundException('Assigned routine not found');
    }

    if (!existing.status.canBeReplaced()) {
      throw new ForbiddenException(
        'Cannot replace a non-active assigned routine',
      );
    }

    const newRoutine = await this.routineRepository.findById(
      input.newRoutineId,
    );
    if (!newRoutine) {
      throw new NotFoundException('New routine not found');
    }

    if (newRoutine.userId !== input.trainerId) {
      throw new ForbiddenException(
        'New routine does not belong to this trainer',
      );
    }

    if (newRoutine.targetAudience !== 'client') {
      throw new ForbiddenException(
        'Only routines marked for clients can be assigned',
      );
    }

    const days = newRoutine.days.map((day) =>
      RoutineDaySnapshot.create({
        dayOfWeek: day.dayOfWeek,
        exercises: day.exercises.map((ex, index) => {
          const firstSet = ex.sets[0];
          return ExerciseSnapshot.create({
            exerciseId: ex.id,
            name: ex.name,
            sets: ex.sets.length,
            reps: firstSet ? firstSet.reps : 10,
            restSeconds:
              firstSet && firstSet.restSeconds != null
                ? firstSet.restSeconds
                : 60,
            order: index + 1,
          });
        }),
      }),
    );

    const exerciseSnapshots = days.flatMap((d) => d.exercises);

    const snapshot = RoutineSnapshot.create({
      routineId: newRoutine.id,
      name: newRoutine.name,
      description: '',
      difficulty: 'intermediate',
      estimatedDuration: 45,
      exercises: exerciseSnapshots,
      days,
    });

    const newAssignedId = crypto.randomUUID();

    const replaced = existing.markAsReplaced(newAssignedId);
    await this.assignedRoutineRepository.save(replaced);

    const newAssigned = TrainerAssignedRoutine.create({
      id: newAssignedId,
      trainerId: input.trainerId,
      clientId: input.clientId,
      linkId: activeLink.id,
      routineId: input.newRoutineId,
      routineSnapshot: snapshot,
      notes: input.notes,
    });

    const saved = await this.assignedRoutineRepository.save(newAssigned);

    const notification = InAppNotification.create(
      input.clientId,
      'Rutina actualizada',
      `Tu entrenador ha actualizado tu rutina asignada: ${newRoutine.name}`,
    );
    await this.notificationRepository.save(notification);

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
