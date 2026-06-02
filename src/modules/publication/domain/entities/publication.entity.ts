import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../errors/publication-domain.error';
import { PublicationContent } from '../value-objects/publication-content.value-object';
import { PublicationMediaUrls } from '../value-objects/publication-media-urls.value-object';
import { PublicationTitle } from '../value-objects/publication-title.value-object';
import { ExerciseSummary } from '../value-objects/exercise-summary.value-object';

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

  private constructor(
    id: string,
    authorUserId: string,
    title: PublicationTitle,
    content: PublicationContent,
    mediaUrls: PublicationMediaUrls,
    workoutSessionId: string | null,
    exerciseSummary: ExerciseSummary | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.authorUserId = authorUserId;
    this.title = title;
    this.content = content;
    this.mediaUrls = mediaUrls;
    this.workoutSessionId = workoutSessionId;
    this.exerciseSummary = exerciseSummary;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public static create(
    id: string,
    authorUserId: string,
    title: PublicationTitle,
    content: PublicationContent,
    mediaUrls: PublicationMediaUrls = PublicationMediaUrls.create(),
    workoutSessionId?: string | null,
    exerciseSummary?: ExerciseSummary | null,
  ): Publication {
    if (!authorUserId || authorUserId.trim().length === 0) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_AUTHOR_REQUIRED,
        'Publication author is required',
        { authorUserId },
      );
    }

    const now = new Date();
    return new Publication(
      id,
      authorUserId.trim(),
      title,
      content,
      mediaUrls,
      workoutSessionId ?? null,
      exerciseSummary ?? null,
      now,
      now,
    );
  }

  public static reconstitute(
    id: string,
    authorUserId: string,
    title: PublicationTitle,
    content: PublicationContent,
    mediaUrls: PublicationMediaUrls,
    workoutSessionId: string | null,
    exerciseSummary: ExerciseSummary | null,
    createdAt: Date,
    updatedAt: Date,
  ): Publication {
    return new Publication(
      id,
      authorUserId,
      title,
      content,
      mediaUrls,
      workoutSessionId,
      exerciseSummary,
      createdAt,
      updatedAt,
    );
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

    return new Publication(
      this.id,
      this.authorUserId,
      input.title ?? this.title,
      input.content ?? this.content,
      input.mediaUrls ?? this.mediaUrls,
      this.workoutSessionId,
      this.exerciseSummary,
      this.createdAt,
      new Date(),
    );
  }
}
