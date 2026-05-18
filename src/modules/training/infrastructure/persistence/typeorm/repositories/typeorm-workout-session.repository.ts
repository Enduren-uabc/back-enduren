import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WorkoutSessionRepository } from '../../../../domain/repositories/workout-session.repository.port';
import { WorkoutSession } from '../../../../domain/entities/workout-session.entity';
import { WorkoutSessionTypeormEntity } from '../entities/workout-session-typeorm.entity';
import { WorkoutSessionExerciseTypeormEntity } from '../entities/workout-session-exercise-typeorm.entity';
import { WorkoutSessionSetTypeormEntity } from '../entities/workout-session-set-typeorm.entity';
import { WorkoutSessionMapper } from '../../../mappers/workout-session.mapper';

@Injectable()
export class TypeormWorkoutSessionRepository implements WorkoutSessionRepository {
  constructor(
    @InjectRepository(WorkoutSessionTypeormEntity)
    private readonly ormRepo: Repository<WorkoutSessionTypeormEntity>,
  ) {}

  public async save(session: WorkoutSession): Promise<WorkoutSession> {
    const ormEntity = WorkoutSessionMapper.toOrm(session);
    const saved = await this.ormRepo.manager.transaction(async (manager) => {
      const existing = await manager.findOne(WorkoutSessionTypeormEntity, {
        where: { id: session.id },
      });

      if (existing) {
        const existingExercises = await manager.find(
          WorkoutSessionExerciseTypeormEntity,
          {
            where: { sessionId: session.id },
            select: { id: true },
          },
        );
        const existingExerciseIds = existingExercises.map((ex) => ex.id);

        if (existingExerciseIds.length > 0) {
          await manager.delete(WorkoutSessionSetTypeormEntity, {
            sessionExerciseId: In(existingExerciseIds),
          });
        }

        await manager.delete(WorkoutSessionExerciseTypeormEntity, {
          sessionId: session.id,
        });
      }

      return manager.save(WorkoutSessionTypeormEntity, ormEntity);
    });
    return WorkoutSessionMapper.toDomain(saved);
  }

  public async findById(id: string): Promise<WorkoutSession | null> {
    const ormEntity = await this.ormRepo.findOne({
      where: { id },
      relations: ['exercises', 'exercises.workoutSets'],
    });
    if (!ormEntity) {
      return null;
    }
    return WorkoutSessionMapper.toDomain(ormEntity);
  }

  public async findInProgressByUserId(
    userId: string,
  ): Promise<WorkoutSession | null> {
    const ormEntity = await this.ormRepo.findOne({
      where: { userId, status: 'in_progress' },
      relations: ['exercises', 'exercises.workoutSets'],
    });
    if (!ormEntity) {
      return null;
    }
    return WorkoutSessionMapper.toDomain(ormEntity);
  }

  public async findFinishedByUserId(userId: string): Promise<WorkoutSession[]> {
    const ormEntities = await this.ormRepo.find({
      where: { userId, status: 'finished' },
      relations: ['exercises', 'exercises.workoutSets'],
      order: { startedAt: 'DESC' },
    });
    return ormEntities.map((e) => WorkoutSessionMapper.toDomain(e));
  }

  public async findFinishedByUserIdAndExerciseId(
    userId: string,
    exerciseId: string,
  ): Promise<WorkoutSession[]> {
    // Find session IDs that contain the specified exerciseId
    const sessionIds = await this.ormRepo
      .createQueryBuilder('session')
      .innerJoin(
        'session.exercises',
        'exercise',
        'exercise.exerciseId = :exerciseId',
        { exerciseId },
      )
      .where('session.userId = :userId', { userId })
      .andWhere('session.status = :status', { status: 'finished' })
      .orderBy('session.startedAt', 'ASC')
      .select('session.id', 'id')
      .getRawMany();

    if (sessionIds.length === 0) {
      return [];
    }

    // Load full sessions with all relations (all exercises, not just the target)
    const ids = sessionIds.map((row: { id: string }) => row.id);
    const ormEntities = await this.ormRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.exercises', 'exercise')
      .leftJoinAndSelect('exercise.workoutSets', 'workoutSet')
      .where('session.id IN (:...ids)', { ids })
      .orderBy('session.startedAt', 'ASC')
      .getMany();

    return ormEntities.map((e) => WorkoutSessionMapper.toDomain(e));
  }
}
