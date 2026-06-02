import { Publication } from '../../../domain/entities/publication.entity';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationContent } from '../../../domain/value-objects/publication-content.value-object';
import { PublicationMediaUrls } from '../../../domain/value-objects/publication-media-urls.value-object';
import { PublicationTitle } from '../../../domain/value-objects/publication-title.value-object';
import { CreateWorkoutPublicationDto } from '../../dto/create-workout-publication.dto';
import { PublicationDto } from '../../dto/publication.dto';
import { PublicationApplicationMapper } from '../../mappers/publication.mapper';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  WORKOUT_SESSION_QUERY_PORT,
  WorkoutSessionQueryPort,
} from '../../ports/workout-session-query.port';

export class CreateWorkoutPublicationUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly workoutSessionQuery: WorkoutSessionQueryPort,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: CreateWorkoutPublicationDto,
  ): Promise<PublicationDto> {
    const session = await this.workoutSessionQuery.findById(
      input.workoutSessionId,
    );
    if (!session) {
      throw new Error(`Workout session not found: ${input.workoutSessionId}`);
    }

    const exerciseSummary =
      this.workoutSessionQuery.buildExerciseSummary(session);

    const publication = Publication.create(
      crypto.randomUUID(),
      actor.userId,
      PublicationTitle.create(input.caption ?? 'Entrenamiento completado'),
      PublicationContent.create(
        input.caption ?? 'Comparte tu progreso con la comunidad.',
      ),
      PublicationMediaUrls.create(input.mediaUrls ?? []),
      input.workoutSessionId,
      exerciseSummary,
    );

    const saved = await this.publicationRepository.save(publication);
    return PublicationApplicationMapper.toDto(saved);
  }
}
