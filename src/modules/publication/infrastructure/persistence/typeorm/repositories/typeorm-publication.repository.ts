import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Publication } from '../../../../domain/entities/publication.entity';
import { PublicationRepository } from '../../../../domain/repositories/publication.repository';
import { PublicationPersistenceMapper } from '../../../mappers/publication.mapper';
import { PublicationTypeormEntity } from '../entities/publication-typeorm.entity';

@Injectable()
export class TypeormPublicationRepository implements PublicationRepository {
  constructor(
    @InjectRepository(PublicationTypeormEntity)
    private readonly ormRepo: Repository<PublicationTypeormEntity>,
  ) {}

  public async save(publication: Publication): Promise<Publication> {
    const saved = await this.ormRepo.save(
      PublicationPersistenceMapper.toOrm(publication),
    );
    return PublicationPersistenceMapper.toDomain(saved);
  }

  public async findById(id: string): Promise<Publication | null> {
    const ormEntity = await this.ormRepo.findOne({ where: { id } });
    return ormEntity ? PublicationPersistenceMapper.toDomain(ormEntity) : null;
  }

  public async findByIdAndAuthorUserId(
    id: string,
    authorUserId: string,
  ): Promise<Publication | null> {
    const ormEntity = await this.ormRepo.findOne({
      where: { id, authorUserId },
    });
    return ormEntity ? PublicationPersistenceMapper.toDomain(ormEntity) : null;
  }

  public async delete(publication: Publication): Promise<void> {
    await this.ormRepo.delete({ id: publication.id });
  }

  public async findFeed(input: {
    limit: number;
    offset: number;
  }): Promise<Publication[]> {
    const ormEntities = await this.ormRepo.find({
      order: { createdAt: 'DESC' },
      take: input.limit,
      skip: input.offset,
    });

    return ormEntities.map((ormEntity) =>
      PublicationPersistenceMapper.toDomain(ormEntity),
    );
  }

  public async countFeed(): Promise<number> {
    return this.ormRepo.count();
  }

  public async findFeedByAuthorUserIds(input: {
    authorUserIds: string[];
    limit: number;
    offset: number;
  }): Promise<Publication[]> {
    if (input.authorUserIds.length === 0) {
      return [];
    }

    const ormEntities = await this.ormRepo.find({
      where: { authorUserId: In(input.authorUserIds) },
      order: { createdAt: 'DESC' },
      take: input.limit,
      skip: input.offset,
    });

    return ormEntities.map((ormEntity) =>
      PublicationPersistenceMapper.toDomain(ormEntity),
    );
  }

  public async countFeedByAuthorUserIds(
    authorUserIds: string[],
  ): Promise<number> {
    if (authorUserIds.length === 0) {
      return 0;
    }

    return this.ormRepo.count({ where: { authorUserId: In(authorUserIds) } });
  }
}
