import { ListExerciseCatalogUseCase } from './list-exercise-catalog.use-case';
import { ExerciseCatalogRepository } from '../../../domain/repositories/exercise-catalog.repository';
import { ExerciseCatalogEntry } from '../../../domain/entities/exercise-catalog-entry.entity';

describe('ListExerciseCatalogUseCase', () => {
  let useCase: ListExerciseCatalogUseCase;
  let repository: ExerciseCatalogRepository;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
    };
    useCase = new ListExerciseCatalogUseCase(repository);
  });

  it('should return paginated catalog entries with defaults', async () => {
    const entry = ExerciseCatalogEntry.create(
      'ex-1',
      'Bench Press',
      'chest',
      'Pectoralis Major',
      'barbell',
    );
    (repository.findAll as jest.Mock).mockResolvedValue({
      data: [entry],
      total: 1,
      page: 1,
      limit: 20,
    });

    const result = await useCase.execute({});

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Bench Press');
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(repository.findAll as jest.Mock).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
    });
  });

  it('should apply search filter', async () => {
    (repository.findAll as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    await useCase.execute({ search: 'press' });

    expect(repository.findAll as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'press' }),
    );
  });

  it('should apply category filter', async () => {
    (repository.findAll as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    await useCase.execute({ category: 'legs' });

    expect(repository.findAll as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'legs' }),
    );
  });

  it('should apply primaryMuscleGroup filter', async () => {
    (repository.findAll as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    await useCase.execute({ primaryMuscleGroup: 'Quadriceps' });

    expect(repository.findAll as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ primaryMuscleGroup: 'Quadriceps' }),
    );
  });

  it('should apply equipment filter', async () => {
    (repository.findAll as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    await useCase.execute({ equipment: 'dumbbell' });

    expect(repository.findAll as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ equipment: 'dumbbell' }),
    );
  });

  it('should apply combined filters', async () => {
    const entry = ExerciseCatalogEntry.create(
      'ex-2',
      'Dumbbell Curl',
      'arms',
      'Biceps',
      'dumbbell',
    );
    (repository.findAll as jest.Mock).mockResolvedValue({
      data: [entry],
      total: 1,
      page: 2,
      limit: 10,
    });

    const result = await useCase.execute({
      search: 'curl',
      category: 'arms',
      equipment: 'dumbbell',
      page: 2,
      limit: 10,
    });

    expect(repository.findAll as jest.Mock).toHaveBeenCalledWith({
      search: 'curl',
      category: 'arms',
      primaryMuscleGroup: undefined,
      equipment: 'dumbbell',
      page: 2,
      limit: 10,
    });
    expect(result.data[0].name).toBe('Dumbbell Curl');
  });

  it('should map multiple entries correctly', async () => {
    const entry1 = ExerciseCatalogEntry.create(
      'ex-3',
      'Squat',
      'legs',
      'Quadriceps',
      'barbell',
    );
    const entry2 = ExerciseCatalogEntry.create(
      'ex-4',
      'Deadlift',
      'back',
      'Latissimus Dorsi',
      'barbell',
    );
    (repository.findAll as jest.Mock).mockResolvedValue({
      data: [entry1, entry2],
      total: 2,
      page: 1,
      limit: 20,
    });

    const result = await useCase.execute({});

    expect(result.data).toHaveLength(2);
    expect(result.data[0].category).toBe('legs');
    expect(result.data[1].equipment).toBe('barbell');
  });
});
