import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../../domain/entities/user.entity';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { UserTypeormEntity } from '../entities/user-typeorm.entity';

@Injectable()
export class TypeormUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserTypeormEntity)
    private readonly ormRepo: Repository<UserTypeormEntity>,
  ) {}

  async save(user: User): Promise<User> {
    const entity = this.toOrm(user);
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.ormRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const entity = await this.ormRepo.findOne({
      where: { username: username.toLowerCase() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.ormRepo.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.ormRepo.count({
      where: { username: username.toLowerCase() },
    });
    return count > 0;
  }

  async findByTrainerCode(trainerCode: string): Promise<User | null> {
    const entity = await this.ormRepo.findOne({
      where: { trainerCode },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySocialId(
    provider: string,
    socialId: string,
  ): Promise<User | null> {
    const entity = await this.ormRepo.findOne({
      where: { authProvider: provider, socialId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  private toOrm(user: User): UserTypeormEntity {
    const entity = new UserTypeormEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.username = user.username;
    entity.passwordHash = user.passwordHash;
    entity.role = user.role;
    entity.emailVerified = user.emailVerified;
    entity.status = user.status;
    entity.trainerCode = user.trainerCode;
    entity.authProvider = user.authProvider;
    entity.socialId = user.socialId;
    entity.privacyAccepted = user.privacyAccepted;
    entity.avatarUrl = user.avatarUrl;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
  }

  private toDomain(entity: UserTypeormEntity): User {
    return User.reconstitute({
      id: entity.id,
      email: entity.email,
      username: entity.username,
      passwordHash: entity.passwordHash,
      role: entity.role as 'admin' | 'trainer' | 'user',
      emailVerified: entity.emailVerified,
      status: entity.status as 'active' | 'inactive' | 'locked',
      trainerCode: entity.trainerCode,
      authProvider: entity.authProvider as 'email' | 'google' | 'apple' | null,
      socialId: entity.socialId,
      privacyAccepted: entity.privacyAccepted,
      avatarUrl: entity.avatarUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
