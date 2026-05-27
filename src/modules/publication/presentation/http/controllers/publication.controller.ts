import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../../../../../shared/storage/domain/services/storage.service';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { FollowedUsersQueryPort } from '../../../application/ports/followed-users-query.port';
import {
  WORKOUT_SESSION_QUERY_PORT,
  WorkoutSessionQueryPort,
} from '../../../application/ports/workout-session-query.port';
import {
  AUTHOR_PROFILE_QUERY_PORT,
  AuthorProfileQueryPort,
} from '../../../application/ports/author-profile-query.port';
import {
  AddPublicationReactionUseCase,
  PUBLICATION_REACTION_REPOSITORY_PORT,
} from '../../../application/use-cases/add-publication-reaction/add-publication-reaction.use-case';
import {
  CreatePublicationCommentUseCase,
  PUBLICATION_COMMENT_REPOSITORY_PORT,
} from '../../../application/use-cases/create-publication-comment/create-publication-comment.use-case';
import { DeletePublicationUseCase } from '../../../application/use-cases/delete-publication/delete-publication.use-case';
import { ListPublicationCommentsUseCase } from '../../../application/use-cases/list-publication-comments/list-publication-comments.use-case';
import {
  ListPublicationsUseCase,
  PUBLICATION_FOLLOWED_USERS_QUERY_PORT,
} from '../../../application/use-cases/list-publications/list-publications.use-case';
import { RemovePublicationReactionUseCase } from '../../../application/use-cases/remove-publication-reaction/remove-publication-reaction.use-case';
import { UpdatePublicationUseCase } from '../../../application/use-cases/update-publication/update-publication.use-case';
import {
  CreatePublicationUseCase,
  PUBLICATION_REPOSITORY_PORT,
} from '../../../application/use-cases/create-publication/create-publication.use-case';
import { CreateWorkoutPublicationUseCase } from '../../../application/use-cases/create-workout-publication/create-workout-publication.use-case';
import { UploadPublicationMediaUseCase } from '../../../application/use-cases/upload-publication-media/upload-publication-media.use-case';
import { DeletePublicationMediaUseCase } from '../../../application/use-cases/delete-publication-media/delete-publication-media.use-case';
import {
  PUBLICATION_MEDIA_REPOSITORY_PORT,
  PublicationMediaRepository,
} from '../../../domain/repositories/publication-media.repository';
import { PublicationCommentRepository } from '../../../domain/repositories/publication-comment.repository';
import { PublicationReactionRepository } from '../../../domain/repositories/publication-reaction.repository';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationDomainErrorFilter } from '../filters/publication-domain-error.filter';
import { CreatePublicationCommentRequestDto } from '../requests/create-publication-comment.request';
import { CreatePublicationRequestDto } from '../requests/create-publication.request';
import { ListPublicationsRequestDto } from '../requests/list-publications.request';
import { UpdatePublicationRequestDto } from '../requests/update-publication.request';
import {
  CreateWorkoutPublicationResponseDto,
  DeletePublicationResponseDto,
  ListPublicationsResponseDto,
  PublicationPresenter,
  PublicationResponseDto,
  WorkoutPublicationPresenter,
} from '../responses/publication.response';
import {
  DeletePublicationReactionResponseDto,
  ListPublicationCommentsResponseDto,
  PublicationInteractionPresenter,
  PublicationReactionResponseDto,
  PublicationCommentResponseDto,
} from '../responses/publication-interaction.response';

@Controller('publications')
@UseGuards(JwtAuthGuard)
@UseFilters(PublicationDomainErrorFilter)
export class PublicationController {
  private readonly createPublicationUseCase: CreatePublicationUseCase;
  private readonly updatePublicationUseCase: UpdatePublicationUseCase;
  private readonly deletePublicationUseCase: DeletePublicationUseCase;
  private readonly listPublicationsUseCase: ListPublicationsUseCase;
  private readonly addReactionUseCase: AddPublicationReactionUseCase;
  private readonly removeReactionUseCase: RemovePublicationReactionUseCase;
  private readonly createCommentUseCase: CreatePublicationCommentUseCase;
  private readonly listCommentsUseCase: ListPublicationCommentsUseCase;
  private readonly createWorkoutPublicationUseCase: CreateWorkoutPublicationUseCase;
  private readonly uploadMediaUseCase: UploadPublicationMediaUseCase;
  private readonly deleteMediaUseCase: DeletePublicationMediaUseCase;

  constructor(
    @Inject(PUBLICATION_REPOSITORY_PORT)
    publicationRepository: PublicationRepository,
    @Inject(PUBLICATION_REACTION_REPOSITORY_PORT)
    reactionRepository: PublicationReactionRepository,
    @Inject(PUBLICATION_COMMENT_REPOSITORY_PORT)
    commentRepository: PublicationCommentRepository,
    @Inject(PUBLICATION_FOLLOWED_USERS_QUERY_PORT)
    followedUsersQuery: FollowedUsersQueryPort,
    @Inject(AUTHOR_PROFILE_QUERY_PORT)
    authorProfileQuery: AuthorProfileQueryPort,
    @Inject(WORKOUT_SESSION_QUERY_PORT)
    private readonly workoutSessionQuery: WorkoutSessionQueryPort,
    @Inject(PUBLICATION_MEDIA_REPOSITORY_PORT)
    private readonly mediaRepository: PublicationMediaRepository,
    private readonly storageService: StorageService,
  ) {
    this.createPublicationUseCase = new CreatePublicationUseCase(
      publicationRepository,
      mediaRepository,
    );
    this.uploadMediaUseCase = new UploadPublicationMediaUseCase(
      storageService,
      mediaRepository,
    );
    this.deleteMediaUseCase = new DeletePublicationMediaUseCase(
      storageService,
      mediaRepository,
    );
    this.updatePublicationUseCase = new UpdatePublicationUseCase(
      publicationRepository,
    );
    this.deletePublicationUseCase = new DeletePublicationUseCase(
      publicationRepository,
    );
    this.listPublicationsUseCase = new ListPublicationsUseCase(
      publicationRepository,
      mediaRepository,
      followedUsersQuery,
      authorProfileQuery,
      reactionRepository,
      commentRepository,
    );
    this.addReactionUseCase = new AddPublicationReactionUseCase(
      publicationRepository,
      reactionRepository,
    );
    this.removeReactionUseCase = new RemovePublicationReactionUseCase(
      publicationRepository,
      reactionRepository,
    );
    this.createCommentUseCase = new CreatePublicationCommentUseCase(
      publicationRepository,
      commentRepository,
    );
    this.listCommentsUseCase = new ListPublicationCommentsUseCase(
      publicationRepository,
      commentRepository,
    );
    this.createWorkoutPublicationUseCase = new CreateWorkoutPublicationUseCase(
      publicationRepository,
      workoutSessionQuery,
    );
  }

  private getActor(user: JwtPayload): CurrentActor {
    return { userId: user.sub };
  }

  @Get()
  public async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListPublicationsRequestDto,
  ): Promise<ListPublicationsResponseDto> {
    const publications = await this.listPublicationsUseCase.execute(
      this.getActor(user),
      {
        limit: query.limit,
        offset: query.offset,
        filter: query.filter,
      },
    );

    return PublicationPresenter.toFeedHttp(publications);
  }

  @Post()
  public async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePublicationRequestDto,
  ): Promise<PublicationResponseDto> {
    const publication = await this.createPublicationUseCase.execute(
      this.getActor(user),
      {
        title: dto.title,
        content: dto.content,
        mediaUrls: dto.mediaUrls,
        mediaIds: dto.mediaIds,
      },
    );

    return PublicationPresenter.toHttp(publication);
  }

  @Post('from-workout/:sessionId')
  public async createFromWorkout(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Body() body: { caption?: string; mediaUrls?: string[] },
  ): Promise<CreateWorkoutPublicationResponseDto> {
    const publication = await this.createWorkoutPublicationUseCase.execute(
      this.getActor(user),
      {
        caption: body.caption,
        mediaUrls: body.mediaUrls,
        workoutSessionId: sessionId,
      },
    );

    return WorkoutPublicationPresenter.toHttp(publication);
  }

  @Post('media/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  public async uploadMedia(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{
    id: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }> {
    const result = await this.uploadMediaUseCase.execute({
      actor: this.getActor(user),
      file,
      sortOrder: 0,
    });
    return result;
  }

  @Delete('media/:mediaId')
  public async deleteMedia(
    @CurrentUser() user: JwtPayload,
    @Param('mediaId') mediaId: string,
  ): Promise<void> {
    await this.deleteMediaUseCase.execute({
      mediaId,
      userId: this.getActor(user).userId,
    });
  }

  @Patch(':publicationId')
  public async update(
    @CurrentUser() user: JwtPayload,
    @Param('publicationId') publicationId: string,
    @Body() dto: UpdatePublicationRequestDto,
  ): Promise<PublicationResponseDto> {
    const publication = await this.updatePublicationUseCase.execute(
      this.getActor(user),
      {
        publicationId,
        title: dto.title,
        content: dto.content,
        mediaUrls: dto.mediaUrls,
      },
    );

    return PublicationPresenter.toHttp(publication);
  }

  @Delete(':publicationId')
  public async delete(
    @CurrentUser() user: JwtPayload,
    @Param('publicationId') publicationId: string,
  ): Promise<DeletePublicationResponseDto> {
    const result = await this.deletePublicationUseCase.execute(
      this.getActor(user),
      { publicationId },
    );

    const response = new DeletePublicationResponseDto();
    response.id = result.id;
    response.deleted = result.deleted;
    return response;
  }

  @Post(':publicationId/reactions')
  public async addReaction(
    @CurrentUser() user: JwtPayload,
    @Param('publicationId') publicationId: string,
  ): Promise<PublicationReactionResponseDto> {
    const reaction = await this.addReactionUseCase.execute(
      this.getActor(user),
      {
        publicationId,
      },
    );

    return PublicationInteractionPresenter.reactionToHttp(reaction);
  }

  @Delete(':publicationId/reactions')
  public async removeReaction(
    @CurrentUser() user: JwtPayload,
    @Param('publicationId') publicationId: string,
  ): Promise<DeletePublicationReactionResponseDto> {
    const result = await this.removeReactionUseCase.execute(
      this.getActor(user),
      {
        publicationId,
      },
    );

    const response = new DeletePublicationReactionResponseDto();
    response.publicationId = result.publicationId;
    response.deleted = result.deleted;
    return response;
  }

  @Post(':publicationId/comments')
  public async createComment(
    @CurrentUser() user: JwtPayload,
    @Param('publicationId') publicationId: string,
    @Body() dto: CreatePublicationCommentRequestDto,
  ): Promise<PublicationCommentResponseDto> {
    const comment = await this.createCommentUseCase.execute(
      this.getActor(user),
      {
        publicationId,
        content: dto.content,
      },
    );

    return PublicationInteractionPresenter.commentToHttp(comment);
  }

  @Get(':publicationId/comments')
  public async listComments(
    @CurrentUser() user: JwtPayload,
    @Param('publicationId') publicationId: string,
  ): Promise<ListPublicationCommentsResponseDto> {
    const comments = await this.listCommentsUseCase.execute(
      this.getActor(user),
      {
        publicationId,
      },
    );

    return PublicationInteractionPresenter.commentsToHttp(comments);
  }
}
