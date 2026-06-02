import { Publication } from '../../domain/entities/publication.entity';
import { PublicationContent } from '../../domain/value-objects/publication-content.value-object';
import { PublicationMediaUrls } from '../../domain/value-objects/publication-media-urls.value-object';
import { PublicationTitle } from '../../domain/value-objects/publication-title.value-object';
import { ExerciseSummary } from '../../domain/value-objects/exercise-summary.value-object';
import { PublicationTypeormEntity } from '../persistence/typeorm/entities/publication-typeorm.entity';

export class PublicationPersistenceMapper {
  public static toDomain(ormEntity: PublicationTypeormEntity): Publication {
    return Publication.reconstitute({
      id: ormEntity.id,
      authorUserId: ormEntity.authorUserId,
      title: PublicationTitle.reconstitute(ormEntity.title),
      content: PublicationContent.reconstitute(ormEntity.content),
      mediaUrls: PublicationMediaUrls.reconstitute(ormEntity.mediaUrls ?? []),
      workoutSessionId: ormEntity.workoutSessionId,
      exerciseSummary: ormEntity.exerciseSummary
        ? ExerciseSummary.create(
            ormEntity.exerciseSummary as unknown as {
              totalExercises: number;
              totalCompletedSets: number;
              totalSets: number;
              totalVolume: number;
              durationMinutes: number;
              routineName: string;
              dayOfWeek: string;
              exercises: Array<{
                exerciseId: string;
                exerciseName: string;
                completedSets: number;
                totalSets: number;
                volume: number;
                workoutSets: Array<{
                  setNumber: number;
                  repsPerformed: number | null;
                  weightUsed: number | null;
                  targetReps: number | null;
                  targetWeight: number | null;
                  completed: boolean;
                }>;
              }>;
            },
          )
        : null,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  public static toOrm(publication: Publication): PublicationTypeormEntity {
    const ormEntity = new PublicationTypeormEntity();
    ormEntity.id = publication.id;
    ormEntity.authorUserId = publication.authorUserId;
    ormEntity.title = publication.title.value;
    ormEntity.content = publication.content.value;
    ormEntity.mediaUrls = publication.mediaUrls.values;
    ormEntity.workoutSessionId = publication.workoutSessionId;
    ormEntity.exerciseSummary = publication.exerciseSummary
      ? (JSON.parse(JSON.stringify(publication.exerciseSummary)) as Record<
          string,
          unknown
        >)
      : null;
    ormEntity.createdAt = publication.createdAt;
    ormEntity.updatedAt = publication.updatedAt;
    return ormEntity;
  }
}
