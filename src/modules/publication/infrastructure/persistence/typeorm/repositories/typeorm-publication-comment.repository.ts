import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicationComment } from '../../../../domain/entities/publication-comment.entity';
import { PublicationCommentRepository } from '../../../../domain/repositories/publication-comment.repository';
import { PublicationCommentPersistenceMapper } from '../../../mappers/publication-comment.mapper';
import { PublicationCommentTypeormEntity } from '../entities/publication-comment-typeorm.entity';

@Injectable()
export class TypeormPublicationCommentRepository implements PublicationCommentRepository {
  constructor(
    @InjectRepository(PublicationCommentTypeormEntity)
    private readonly ormRepo: Repository<PublicationCommentTypeormEntity>,
  ) {}

  public async save(comment: PublicationComment): Promise<PublicationComment> {
    const saved = await this.ormRepo.save(
      PublicationCommentPersistenceMapper.toOrm(comment),
    );
    return PublicationCommentPersistenceMapper.toDomain(saved);
  }

  public async findById(id: string): Promise<PublicationComment | null> {
    const ormEntity = await this.ormRepo.findOne({ where: { id } });
    return ormEntity
      ? PublicationCommentPersistenceMapper.toDomain(ormEntity)
      : null;
  }

  public async findByPublicationId(
    publicationId: string,
  ): Promise<PublicationComment[]> {
    const ormEntities = await this.ormRepo.find({
      where: { publicationId },
      order: { createdAt: 'ASC' },
    });

    return ormEntities.map((ormEntity) =>
      PublicationCommentPersistenceMapper.toDomain(ormEntity),
    );
  }

  public async delete(comment: PublicationComment): Promise<void> {
    await this.ormRepo.delete({ id: comment.id });
  }
}
