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

export interface AssignRoutineToClientInput {
  trainerId: string;
  clientId: string;
  routineId: string;
  notes?: string;
}

export interface AssignedRoutineOutput {
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
export class AssignRoutineToClientUseCase {
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
    input: AssignRoutineToClientInput,
  ): Promise<AssignedRoutineOutput> {
    const activeLink =
      await this.linkRepository.findActiveByTrainerIdAndClientId(
        input.trainerId,
        input.clientId,
      );
    if (!activeLink) {
      throw new ForbiddenException('No active link with this client');
    }

    const routine = await this.routineRepository.findById(input.routineId);
    if (!routine) {
      throw new NotFoundException('Routine not found');
    }

    if (routine.userId !== input.trainerId) {
      throw new ForbiddenException('Routine does not belong to this trainer');
    }

    const existingActive =
      await this.assignedRoutineRepository.findActiveByClientAndTrainer(
        input.clientId,
        input.trainerId,
      );
    if (existingActive) {
      throw new ForbiddenException(
        'Client already has an active assigned routine. Use replace instead.',
      );
    }

    const days = routine.days.map((day) =>
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
              firstSet?.restSeconds != null ? firstSet.restSeconds : 60,
            order: index + 1,
          });
        }),
      }),
    );

    const exerciseSnapshots = days.flatMap((d) => d.exercises);

    const snapshot = RoutineSnapshot.create({
      routineId: routine.id,
      name: routine.name,
      description: '',
      difficulty: 'intermediate',
      estimatedDuration: 45,
      exercises: exerciseSnapshots,
      days,
    });

    const assigned = TrainerAssignedRoutine.create({
      id: crypto.randomUUID(),
      trainerId: input.trainerId,
      clientId: input.clientId,
      linkId: activeLink.id,
      routineId: input.routineId,
      routineSnapshot: snapshot,
      notes: input.notes,
    });

    const saved = await this.assignedRoutineRepository.save(assigned);

    const notification = InAppNotification.create(
      input.clientId,
      'Nueva rutina asignada',
      `Tu entrenador te ha asignado la rutina: ${routine.name}`,
    );
    await this.notificationRepository.save(notification);

    return this.toOutput(saved);
  }

  private toOutput(assigned: TrainerAssignedRoutine): AssignedRoutineOutput {
    return {
      id: assigned.id,
      clientId: assigned.clientId,
      trainerId: assigned.trainerId,
      routineId: assigned.routineId,
      routineSnapshot: {
        name: assigned.routineSnapshot.name,
        description: assigned.routineSnapshot.description,
        difficulty: assigned.routineSnapshot.difficulty,
        estimatedDuration: assigned.routineSnapshot.estimatedDuration,
        exercises: assigned.routineSnapshot.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.restSeconds,
          order: e.order,
        })),
        days: assigned.routineSnapshot.days.map((d) => ({
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
      status: assigned.status.value,
      assignedAt: assigned.assignedAt,
      notes: assigned.notes,
    };
  }
}
