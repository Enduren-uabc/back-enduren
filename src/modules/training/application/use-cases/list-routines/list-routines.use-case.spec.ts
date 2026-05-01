import { ListRoutinesUseCase } from './list-routines.use-case';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { Routine } from '../../../domain/entities/routine.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { Exercise } from '../../../domain/entities/exercise.entity';

describe('ListRoutinesUseCase', () => {
  let useCase: ListRoutinesUseCase;
  let routineRepository: RoutineRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  beforeEach(() => {
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
    useCase = new ListRoutinesUseCase(routineRepository);
  });

  it('should return an empty list when user has no routines', async () => {
    (routineRepository.findByUserId as jest.Mock).mockResolvedValue([]);

    const result = await useCase.execute(actor);

    expect(result).toEqual([]);
    expect(routineRepository.findByUserId as jest.Mock).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('should return all routines for the current user with isActive status', async () => {
    const routine1 = Routine.reconstitute(
      'r-1',
      'Routine A',
      'user-1',
      [RoutineDay.create('monday')],
      true,
      new Date('2026-01-01'),
      new Date('2026-01-01'),
    );
    const routine2 = Routine.reconstitute(
      'r-2',
      'Routine B',
      'user-1',
      [RoutineDay.create('wednesday')],
      false,
      new Date('2026-01-02'),
      new Date('2026-01-02'),
    );

    (routineRepository.findByUserId as jest.Mock).mockResolvedValue([
      routine1,
      routine2,
    ]);

    const result = await useCase.execute(actor);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('r-1');
    expect(result[0].name).toBe('Routine A');
    expect(result[0].isActive).toBe(true);
    expect(result[1].id).toBe('r-2');
    expect(result[1].name).toBe('Routine B');
    expect(result[1].isActive).toBe(false);
  });

  it('should include exercise configuration in routine days', async () => {
    const day = RoutineDay.create('monday');
    const exercise = Exercise.create('ex-1', 'Push-ups', 0);
    const dayWithEx = day.addExercise(exercise);
    const dayWithConfig = dayWithEx.configureExercise('ex-1', 3, 12, 50);
    const routine = Routine.reconstitute(
      'r-1',
      'Routine A',
      'user-1',
      [dayWithConfig],
      true,
      new Date('2026-01-01'),
      new Date('2026-01-01'),
    );

    (routineRepository.findByUserId as jest.Mock).mockResolvedValue([routine]);

    const result = await useCase.execute(actor);

    expect(result).toHaveLength(1);
    expect(result[0].days).toHaveLength(1);
    expect(result[0].days[0].exercises).toHaveLength(1);
    expect(result[0].days[0].exercises[0].sets).toBe(3);
    expect(result[0].days[0].exercises[0].repsPerSet).toBe(12);
    expect(result[0].days[0].exercises[0].weight).toBe(50);
  });
});
