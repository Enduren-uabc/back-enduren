import { StartWorkoutSessionUseCase } from './start-workout-session.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { Routine } from '../../../domain/entities/routine.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { Exercise } from '../../../domain/entities/exercise.entity';
import { RoutineExerciseSet } from '../../../domain/value-objects/routine-exercise-set.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';

describe('StartWorkoutSessionUseCase', () => {
  let useCase: StartWorkoutSessionUseCase;
  let workoutSessionRepository: WorkoutSessionRepository;
  let routineRepository: RoutineRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const exerciseWithConfig = Exercise.reconstitute(
    'exercise-1',
    'Bench Press',
    1,
    [
      RoutineExerciseSet.reconstitute('s-1', 1, 10, 50, null),
      RoutineExerciseSet.reconstitute('s-2', 2, 10, 50, null),
      RoutineExerciseSet.reconstitute('s-3', 3, 8, 55, null),
    ],
  );

  const exerciseWithoutConfig = Exercise.reconstitute(
    'exercise-2',
    'Squat',
    2,
    [],
  );

  const routineDay = RoutineDay.reconstitute('monday', [
    exerciseWithConfig,
    exerciseWithoutConfig,
  ]);

  const routine = Routine.reconstitute(
    'routine-1',
    'My Routine',
    'user-1',
    [routineDay],
    false,
    new Date('2026-01-01'),
    new Date('2026-01-01'),
  );

  beforeEach(() => {
    workoutSessionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findInProgressByUserId: jest.fn(),
    };
    routineRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      existsByNameForUser: jest.fn(),
      countByUserId: jest.fn(),
      findActiveByUserId: jest.fn(),
      findByIdAndUserId: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new StartWorkoutSessionUseCase(
      workoutSessionRepository,
      routineRepository,
    );
  });

  describe('RF-12: Start workout session from active routine', () => {
    it('should start a session when routine exists and no session in progress', async () => {
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (
        workoutSessionRepository.findInProgressByUserId as jest.Mock
      ).mockResolvedValue(null);
      (workoutSessionRepository.save as jest.Mock).mockImplementation(
        (session: WorkoutSession) => Promise.resolve(session),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
      });

      expect(result.userId).toBe('user-1');
      expect(result.routineId).toBe('routine-1');
      expect(result.status).toBe('in_progress');
      expect(result.exercises).toHaveLength(2);
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(result.finishedAt).toBeNull();
    });

    it('should load exercises from routine configuration with detailed sets (RF-12.0.1)', async () => {
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (
        workoutSessionRepository.findInProgressByUserId as jest.Mock
      ).mockResolvedValue(null);
      (workoutSessionRepository.save as jest.Mock).mockImplementation(
        (session: WorkoutSession) => Promise.resolve(session),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
      });

      // Exercise with configuration
      expect(result.exercises[0].exerciseId).toBe('exercise-1');
      expect(result.exercises[0].exerciseName).toBe('Bench Press');
      expect(result.exercises[0].targetSets).toHaveLength(3);
      expect(result.exercises[0].targetSets[0].setNumber).toBe(1);
      expect(result.exercises[0].targetSets[0].reps).toBe(10);
      expect(result.exercises[0].targetSets[0].weight).toBe(50);
      expect(result.exercises[0].targetSets[2].reps).toBe(8);
      expect(result.exercises[0].targetSets[2].weight).toBe(55);
      expect(result.exercises[0].workoutSets).toHaveLength(3);
      expect(result.exercises[0].workoutSets[0].targetReps).toBe(10);
      expect(result.exercises[0].workoutSets[0].targetWeight).toBe(50);
      expect(result.exercises[0].workoutSets[2].targetReps).toBe(8);
      expect(result.exercises[0].workoutSets[2].targetWeight).toBe(55);

      // Exercise without configuration (defaults)
      expect(result.exercises[1].exerciseId).toBe('exercise-2');
      expect(result.exercises[1].exerciseName).toBe('Squat');
      expect(result.exercises[1].targetSets).toHaveLength(3);
      expect(result.exercises[1].targetSets[0].reps).toBe(10);
      expect(result.exercises[1].targetSets[0].weight).toBe(0);
      expect(result.exercises[1].workoutSets[0].targetReps).toBe(10);
      expect(result.exercises[1].workoutSets[0].targetWeight).toBe(0);
    });
  });

  describe('SESSION_NO_ACTIVE_ROUTINE error', () => {
    it('should reject when routine does not exist', async () => {
      (routineRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        useCase.execute(actor, { routineId: 'nonexistent' }),
      ).rejects.toThrow(WorkoutSessionDomainError);

      try {
        await useCase.execute(actor, { routineId: 'nonexistent' });
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        );
      }
    });

    it('should reject when routine belongs to another user', async () => {
      const otherUserRoutine = Routine.reconstitute(
        'routine-2',
        'Other Routine',
        'user-2',
        [routineDay],
        false,
        new Date(),
        new Date(),
      );
      (routineRepository.findById as jest.Mock).mockResolvedValue(
        otherUserRoutine,
      );

      await expect(
        useCase.execute(actor, { routineId: 'routine-2' }),
      ).rejects.toThrow(WorkoutSessionDomainError);
    });
  });

  describe('SESSION_ALREADY_IN_PROGRESS error', () => {
    it('should reject when user already has a session in progress', async () => {
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      const existingSession = WorkoutSession.create(
        'existing-session',
        'user-1',
        'routine-1',
        [],
      );
      (
        workoutSessionRepository.findInProgressByUserId as jest.Mock
      ).mockResolvedValue(existingSession);

      await expect(
        useCase.execute(actor, { routineId: 'routine-1' }),
      ).rejects.toThrow(WorkoutSessionDomainError);

      try {
        await useCase.execute(actor, { routineId: 'routine-1' });
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_IN_PROGRESS,
        );
      }
    });
  });
});
