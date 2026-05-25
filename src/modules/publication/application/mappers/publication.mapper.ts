import { Publication } from '../../domain/entities/publication.entity';
import { PublicationComment } from '../../domain/entities/publication-comment.entity';
import { PublicationReaction } from '../../domain/entities/publication-reaction.entity';
import { PublicationCommentDto } from '../dto/publication-comment.dto';
import {
  PublicationDto,
  ExerciseSummaryDto,
  PublicationMediaDto,
} from '../dto/publication.dto';
import { PublicationReactionDto } from '../dto/publication-reaction.dto';

export class PublicationApplicationMapper {
  public static toDto(
    publication: Publication,
    media: PublicationMediaDto[] = [],
  ): PublicationDto {
    return {
      id: publication.id,
      authorUserId: publication.authorUserId,
      title: publication.title.value,
      content: publication.content.value,
      mediaUrls: publication.mediaUrls.values,
      media,
      workoutSessionId: publication.workoutSessionId,
      exerciseSummary: publication.exerciseSummary
        ? {
            totalExercises: publication.exerciseSummary.totalExercises,
            totalCompletedSets: publication.exerciseSummary.totalCompletedSets,
            totalSets: publication.exerciseSummary.totalSets,
            totalVolume: publication.exerciseSummary.totalVolume,
            durationMinutes: publication.exerciseSummary.durationMinutes,
            routineName: publication.exerciseSummary.routineName,
            dayOfWeek: publication.exerciseSummary.dayOfWeek,
            exercises: publication.exerciseSummary.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName,
              completedSets: ex.completedSets,
              totalSets: ex.totalSets,
              volume: ex.volume,
              workoutSets: ex.workoutSets.map((s) => ({
                setNumber: s.setNumber,
                repsPerformed: s.repsPerformed,
                weightUsed: s.weightUsed,
                targetReps: s.targetReps,
                targetWeight: s.targetWeight,
                completed: s.completed,
              })),
            })),
          }
        : null,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    };
  }

  public static reactionToDto(
    reaction: PublicationReaction,
  ): PublicationReactionDto {
    return {
      id: reaction.id,
      publicationId: reaction.publicationId,
      authorUserId: reaction.authorUserId,
      createdAt: reaction.createdAt,
    };
  }

  public static commentToDto(
    comment: PublicationComment,
  ): PublicationCommentDto {
    return {
      id: comment.id,
      publicationId: comment.publicationId,
      authorUserId: comment.authorUserId,
      content: comment.content.value,
      createdAt: comment.createdAt,
    };
  }
}
