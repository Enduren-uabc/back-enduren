import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StorageService } from '../../../../../shared/storage/domain/services/storage.service';
import { PublicationMedia } from '../../../domain/entities/publication-media.entity';
import {
  PUBLICATION_MEDIA_REPOSITORY_PORT,
  PublicationMediaRepository,
} from '../../../domain/repositories/publication-media.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface UploadPublicationMediaInput {
  actor: CurrentActor;
  file: Express.Multer.File;
  sortOrder: number;
}

export interface UploadPublicationMediaOutput {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

@Injectable()
export class UploadPublicationMediaUseCase {
  constructor(
    private readonly storageService: StorageService,
    @Inject(PUBLICATION_MEDIA_REPOSITORY_PORT)
    private readonly mediaRepository: PublicationMediaRepository,
  ) {}

  async execute(
    input: UploadPublicationMediaInput,
  ): Promise<UploadPublicationMediaOutput> {
    const uploadOutput = await this.storageService.uploadFile(
      input.actor.userId,
      'publication',
      input.file,
    );

    const signedUrl = await this.storageService.getSignedUrl(
      uploadOutput.containerName,
      uploadOutput.blobPath,
      315360000,
    );

    const media = PublicationMedia.create({
      id: randomUUID(),
      url: signedUrl,
      fileName: input.file.originalname,
      fileSize: input.file.size,
      mimeType: input.file.mimetype,
      sortOrder: input.sortOrder,
    });

    await this.mediaRepository.save(media);

    return {
      id: media.id,
      url: media.url,
      fileName: media.fileName,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
    };
  }
}
