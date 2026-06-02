import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicationMedia } from '../../../../domain/entities/publication-media.entity';
import { PublicationMediaRepository } from '../../../../domain/repositories/publication-media.repository';
import { PublicationMediaMapper } from '../../../mappers/publication-media.mapper';
import { PublicationMediaTypeormEntity } from '../entities/publication-media-typeorm.entity';

@Injectable()
export class TypeormPublicationMediaRepository implements PublicationMediaRepository {
  constructor(
    @InjectRepository(PublicationMediaTypeormEntity)
    private readonly ormRepo: Repository<PublicationMediaTypeormEntity>,
  ) {}

  async save(media: PublicationMedia): Promise<PublicationMedia> {
    const saved = await this.ormRepo.save(PublicationMediaMapper.toOrm(media));
    return PublicationMediaMapper.toDomain(saved);
  }

  async findById(id: string): Promise<PublicationMedia | null> {
    const orm = await this.ormRepo.findOne({ where: { id } });
    return orm ? PublicationMediaMapper.toDomain(orm) : null;
  }

  async findByPublicationId(
    publicationId: string,
  ): Promise<PublicationMedia[]> {
    const orms = await this.ormRepo.find({
      where: { publicationId },
      order: { sortOrder: 'ASC' },
    });
    return orms.map(PublicationMediaMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete(id);
  }

  async linkToPublication(
    mediaIds: string[],
    publicationId: string,
  ): Promise<void> {
    await this.ormRepo.update(mediaIds, { publicationId });
  }

  async deleteByPublicationId(publicationId: string): Promise<void> {
    await this.ormRepo.delete({ publicationId });
  }
}
