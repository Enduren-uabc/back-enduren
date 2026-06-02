import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../errors/publication-domain.error';
import { PublicationContent } from '../value-objects/publication-content.value-object';
import { PublicationMediaUrls } from '../value-objects/publication-media-urls.value-object';
import { PublicationTitle } from '../value-objects/publication-title.value-object';
import { ExerciseSummary } from '../value-objects/exercise-summary.value-object';

export interface PublicationProps {
  id: string;
  authorUserId: string;
  title: PublicationTitle;
  content: PublicationContent;
  mediaUrls: PublicationMediaUrls;
  workoutSessionId: string | null;
  exerciseSummary: ExerciseSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePublicationParams {
  id: string;
  authorUserId: string;
  title: PublicationTitle;
  content: PublicationContent;
  mediaUrls?: PublicationMediaUrls;
  workoutSessionId?: string | null;
  exerciseSummary?: ExerciseSummary | null;
}

export class Publication {
  public readonly id: string;
  public readonly authorUserId: string;
  public readonly title: PublicationTitle;
  public readonly content: PublicationContent;
  public readonly mediaUrls: PublicationMediaUrls;
  public readonly workoutSessionId: string | null;
  public readonly exerciseSummary: ExerciseSummary | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: PublicationProps) {
    this.id = props.id;
    this.authorUserId = props.authorUserId;
    this.title = props.title;
    this.content = props.content;
    this.mediaUrls = props.mediaUrls;
    this.workoutSessionId = props.workoutSessionId;
    this.exerciseSummary = props.exerciseSummary;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(params: CreatePublicationParams): Publication {
    if (!params.authorUserId || params.authorUserId.trim().length === 0) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_AUTHOR_REQUIRED,
        'Publication author is required',
        { authorUserId: params.authorUserId },
      );
    }

    const now = new Date();
    return new Publication({
      id: params.id,
      authorUserId: params.authorUserId.trim(),
      title: params.title,
      content: params.content,
      mediaUrls: params.mediaUrls ?? PublicationMediaUrls.create(),
      workoutSessionId: params.workoutSessionId ?? null,
      exerciseSummary: params.exerciseSummary ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: PublicationProps): Publication {
    return new Publication(props);
  }

  public ensureOwnedBy(actorUserId: string): void {
    if (this.authorUserId !== actorUserId) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_NOT_OWNED,
        'Publication does not belong to the current user',
        { publicationId: this.id, actorUserId },
      );
    }
  }

  public update(input: {
    title?: PublicationTitle;
    content?: PublicationContent;
    mediaUrls?: PublicationMediaUrls;
  }): Publication {
    if (
      input.title === undefined &&
      input.content === undefined &&
      input.mediaUrls === undefined
    ) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_UPDATE_EMPTY,
        'At least one publication field must be provided',
        { publicationId: this.id },
      );
    }

    return new Publication({
      id: this.id,
      authorUserId: this.authorUserId,
      title: input.title ?? this.title,
      content: input.content ?? this.content,
      mediaUrls: input.mediaUrls ?? this.mediaUrls,
      workoutSessionId: this.workoutSessionId,
      exerciseSummary: this.exerciseSummary,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
