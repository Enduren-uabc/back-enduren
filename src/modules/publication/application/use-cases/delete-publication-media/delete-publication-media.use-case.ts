import { Inject, Injectable } from '@nestjs/common';
import { StorageService } from '../../../../../shared/storage/domain/services/storage.service';
import {
  PUBLICATION_MEDIA_REPOSITORY_PORT,
  PublicationMediaRepository,
} from '../../../domain/repositories/publication-media.repository';

export interface DeletePublicationMediaInput {
  mediaId: string;
  userId: string;
}

@Injectable()
export class DeletePublicationMediaUseCase {
  constructor(
    private readonly storageService: StorageService,
    @Inject(PUBLICATION_MEDIA_REPOSITORY_PORT)
    private readonly mediaRepository: PublicationMediaRepository,
  ) {}

  async execute(input: DeletePublicationMediaInput): Promise<void> {
    const media = await this.mediaRepository.findById(input.mediaId);
    if (!media) return;
    if (media.publicationId !== null) return;
    await this.mediaRepository.delete(input.mediaId);
  }
}
