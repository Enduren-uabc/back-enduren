import { Routine } from '../../../domain/entities/routine.entity';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { RoutineErrorCode } from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { ForkWorkoutToRoutineUseCase } from './fork-workout-to-routine.use-case';

it('does not import a different user’s workout session into an owned routine', async () => {
  const routine = Routine.create({
    id: 'routine',
    name: 'Owned',
    userId: 'owner',
    days: [RoutineDay.create('monday')],
  });
  const foreignSession = WorkoutSession.create({
    id: 'session',
    userId: 'other',
    routineId: 'foreign',
    exercises: [],
  });
  const routines = {
    findByIdAndUserId: jest.fn().mockResolvedValue(routine),
    save: jest.fn(),
  };
  const sessions = { findById: jest.fn().mockResolvedValue(foreignSession) };
  const useCase = new ForkWorkoutToRoutineUseCase(
    routines as unknown as RoutineRepository,
    sessions as unknown as WorkoutSessionRepository,
  );

  await expect(
    useCase.execute(
      { userId: 'owner', role: 'user' },
      {
        routineId: routine.id,
        dayOfWeek: 'monday',
        sourceWorkoutSessionId: foreignSession.id,
      },
    ),
  ).rejects.toMatchObject({ code: RoutineErrorCode.ROUTINE_NOT_OWNED });
  expect(routines.save).not.toHaveBeenCalled();
});
