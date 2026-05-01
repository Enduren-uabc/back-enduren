import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutSessionRepository } from '../../../../domain/repositories/workout-session.repository.port';
import { WorkoutSession } from '../../../../domain/entities/workout-session.entity';
import { WorkoutSessionTypeormEntity } from '../entities/workout-session-typeorm.entity';
import { WorkoutSessionMapper } from '../../../mappers/workout-session.mapper';

@Injectable()
export class TypeormWorkoutSessionRepository implements WorkoutSessionRepository {
  constructor(
    @InjectRepository(WorkoutSessionTypeormEntity)
    private readonly ormRepo: Repository<WorkoutSessionTypeormEntity>,
  ) {}

  public async save(session: WorkoutSession): Promise<WorkoutSession> {
    const ormEntity = WorkoutSessionMapper.toOrm(session);
    const saved = await this.ormRepo.save(ormEntity);
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
}
