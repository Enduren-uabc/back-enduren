import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../../../domain/entities/profile.entity';
import { ProfileRepository } from '../../../../domain/repositories/profile.repository';
import { ProfileTypeormEntity } from '../entities/profile-typeorm.entity';

@Injectable()
export class TypeormProfileRepository implements ProfileRepository {
  constructor(
    @InjectRepository(ProfileTypeormEntity)
    private readonly ormRepo: Repository<ProfileTypeormEntity>,
  ) {}

  async save(profile: Profile): Promise<Profile> {
    const entity = this.toOrm(profile);
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Profile | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const entity = await this.ormRepo.findOne({ where: { userId } });
    return entity ? this.toDomain(entity) : null;
  }

  private toOrm(profile: Profile): ProfileTypeormEntity {
    const entity = new ProfileTypeormEntity();
    entity.id = profile.id;
    entity.userId = profile.userId;
    entity.fullName = profile.fullName;
    entity.birthDate = profile.birthDate;
    entity.gender = profile.gender;
    entity.weight = profile.weight;
    entity.height = profile.height;
    entity.experienceLevel = profile.experienceLevel;
    entity.mainGoal = profile.mainGoal;
    entity.daysAvailablePerWeek = profile.daysAvailablePerWeek;
    entity.weightUnit = profile.weightUnit;
    entity.createdAt = profile.createdAt;
    entity.updatedAt = profile.updatedAt;
    return entity;
  }

  private toDomain(entity: ProfileTypeormEntity): Profile {
    return Profile.reconstitute({
      id: entity.id,
      userId: entity.userId,
      fullName: entity.fullName,
      birthDate: entity.birthDate,
      gender: entity.gender as 'male' | 'female' | 'other',
      weight: Number(entity.weight),
      height: Number(entity.height),
      experienceLevel: entity.experienceLevel as 'beginner' | 'intermediate' | 'advanced',
      mainGoal: entity.mainGoal as 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_endurance' | 'general_fitness',
      daysAvailablePerWeek: entity.daysAvailablePerWeek,
      weightUnit: entity.weightUnit as 'kg' | 'lbs',
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
