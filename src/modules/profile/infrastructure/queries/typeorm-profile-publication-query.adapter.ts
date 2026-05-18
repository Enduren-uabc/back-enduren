import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProfilePublicationPage,
  ProfilePublicationQueryPort,
} from '../../application/ports/profile-publication-query.port';
import { PublicationTypeormEntity } from '../../../publication/infrastructure/persistence/typeorm/entities/publication-typeorm.entity';

@Injectable()
export class TypeormProfilePublicationQueryAdapter implements ProfilePublicationQueryPort {
  constructor(
    @InjectRepository(PublicationTypeormEntity)
    private readonly publicationRepo: Repository<PublicationTypeormEntity>,
  ) {}

  public async findByAuthorUserId(input: {
    authorUserId: string;
    limit: number;
    offset: number;
  }): Promise<ProfilePublicationPage> {
    const [publications, total] = await this.publicationRepo.findAndCount({
      where: { authorUserId: input.authorUserId },
      order: { createdAt: 'DESC' },
      take: input.limit,
      skip: input.offset,
    });

    return {
      items: publications.map((publication) => ({
        id: publication.id,
        authorUserId: publication.authorUserId,
        title: publication.title,
        content: publication.content,
        mediaUrls: publication.mediaUrls ?? [],
        createdAt: publication.createdAt,
        updatedAt: publication.updatedAt,
      })),
      limit: input.limit,
      offset: input.offset,
      total,
      hasMore: input.offset + publications.length < total,
    };
  }
}
