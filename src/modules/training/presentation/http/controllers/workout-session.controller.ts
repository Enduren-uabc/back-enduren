import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Inject,
  UseFilters,
} from '@nestjs/common';
import {
  StartWorkoutSessionUseCase,
  WORKOUT_SESSION_REPOSITORY_PORT,
  ROUTINE_REPOSITORY_PORT_FOR_SESSION,
  StartWorkoutSessionInput,
} from '../../../application/use-cases/start-workout-session/start-workout-session.use-case';
import { FinishWorkoutSessionUseCase } from '../../../application/use-cases/finish-workout-session/finish-workout-session.use-case';
import { ResumeWorkoutSessionUseCase } from '../../../application/use-cases/resume-workout-session/resume-workout-session.use-case';
import { GetWorkoutSessionUseCase } from '../../../application/use-cases/get-workout-session/get-workout-session.use-case';
import { RegisterSetRepsAndWeightUseCase } from '../../../application/use-cases/register-set-reps-and-weight/register-set-reps-and-weight.use-case';
import { MarkSetAsCompletedUseCase } from '../../../application/use-cases/mark-set-as-completed/mark-set-as-completed.use-case';
import { AdvanceToNextExerciseUseCase } from '../../../application/use-cases/advance-to-next-exercise/advance-to-next-exercise.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { CURRENT_ACTOR_PORT } from '../../../application/use-cases/create-routine/create-routine.use-case';
import { StartWorkoutSessionRequestDto } from '../dtos/start-workout-session.request';
import { RegisterSetRepsAndWeightRequestDto } from '../dtos/register-set-reps-and-weight.request';
import {
  WorkoutSessionResponseDto,
  WorkoutExerciseResponseDto,
  WorkoutSetResponseDto,
} from '../dtos/workout-session.response';
import { WorkoutSessionDomainErrorFilter } from '../filters/workout-session-domain-error.filter';

@Controller('workout-sessions')
@UseFilters(WorkoutSessionDomainErrorFilter)
export class WorkoutSessionController {
  private readonly startWorkoutSessionUseCase: StartWorkoutSessionUseCase;
  private readonly finishWorkoutSessionUseCase: FinishWorkoutSessionUseCase;
  private readonly resumeWorkoutSessionUseCase: ResumeWorkoutSessionUseCase;
  private readonly getWorkoutSessionUseCase: GetWorkoutSessionUseCase;
  private readonly registerSetRepsAndWeightUseCase: RegisterSetRepsAndWeightUseCase;
  private readonly markSetAsCompletedUseCase: MarkSetAsCompletedUseCase;
  private readonly advanceToNextExerciseUseCase: AdvanceToNextExerciseUseCase;

  constructor(
    @Inject(WORKOUT_SESSION_REPOSITORY_PORT)
    workoutSessionRepository: WorkoutSessionRepository,
    @Inject(ROUTINE_REPOSITORY_PORT_FOR_SESSION)
    routineRepository: RoutineRepository,
    @Inject(CURRENT_ACTOR_PORT) private readonly currentActor: CurrentActor,
  ) {
    this.startWorkoutSessionUseCase = new StartWorkoutSessionUseCase(
      workoutSessionRepository,
      routineRepository,
    );
    this.finishWorkoutSessionUseCase = new FinishWorkoutSessionUseCase(
      workoutSessionRepository,
    );
    this.resumeWorkoutSessionUseCase = new ResumeWorkoutSessionUseCase(
      workoutSessionRepository,
    );
    this.getWorkoutSessionUseCase = new GetWorkoutSessionUseCase(
      workoutSessionRepository,
    );
    this.registerSetRepsAndWeightUseCase = new RegisterSetRepsAndWeightUseCase(
      workoutSessionRepository,
    );
    this.markSetAsCompletedUseCase = new MarkSetAsCompletedUseCase(
      workoutSessionRepository,
    );
    this.advanceToNextExerciseUseCase = new AdvanceToNextExerciseUseCase(
      workoutSessionRepository,
    );
  }

  @Post()
  public async start(
    @Body() dto: StartWorkoutSessionRequestDto,
  ): Promise<WorkoutSessionResponseDto> {
    const input: StartWorkoutSessionInput = {
      routineId: dto.routineId,
    };
    const result = await this.startWorkoutSessionUseCase.execute(
      this.currentActor,
      input,
    );
    return this.mapToResponse(result);
  }

  @Patch(':sessionId/finish')
  public async finish(
    @Param('sessionId') sessionId: string,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.finishWorkoutSessionUseCase.execute(
      this.currentActor,
      { sessionId },
    );
    return this.mapToResponse(result);
  }

  @Get('in-progress')
  public async resume(): Promise<WorkoutSessionResponseDto> {
    const result = await this.resumeWorkoutSessionUseCase.execute(
      this.currentActor,
    );
    return this.mapToResponse(result);
  }

  @Get(':sessionId')
  public async get(
    @Param('sessionId') sessionId: string,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.getWorkoutSessionUseCase.execute(
      this.currentActor,
      { sessionId },
    );
    return this.mapToResponse(result);
  }

  @Patch(':sessionId/exercises/:exerciseIndex/sets/:setNumber')
  public async registerSetRepsAndWeight(
    @Param('sessionId') sessionId: string,
    @Param('exerciseIndex') exerciseIndex: number,
    @Param('setNumber') setNumber: number,
    @Body() dto: RegisterSetRepsAndWeightRequestDto,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.registerSetRepsAndWeightUseCase.execute(
      this.currentActor,
      {
        sessionId,
        exerciseIndex,
        setNumber,
        repsPerformed: dto.repsPerformed,
        weightUsed: dto.weightUsed,
      },
    );
    return this.mapToResponse(result);
  }

  @Patch(':sessionId/exercises/:exerciseIndex/sets/:setNumber/complete')
  public async markSetAsCompleted(
    @Param('sessionId') sessionId: string,
    @Param('exerciseIndex') exerciseIndex: number,
    @Param('setNumber') setNumber: number,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.markSetAsCompletedUseCase.execute(
      this.currentActor,
      { sessionId, exerciseIndex, setNumber },
    );
    return this.mapToResponse(result);
  }

  @Post(':sessionId/advance-exercise')
  public async advanceToNextExercise(
    @Param('sessionId') sessionId: string,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.advanceToNextExerciseUseCase.execute(
      this.currentActor,
      { sessionId },
    );
    return this.mapToResponse(result);
  }

  private mapToResponse(result: {
    id: string;
    userId: string;
    routineId: string;
    status: string;
    currentExerciseIndex: number;
    exercises: Array<{
      exerciseId: string;
      exerciseName: string;
      order: number;
      sets: number;
      repsPerSet: number;
      weight: number;
      workoutSets: Array<{
        setNumber: number;
        repsPerformed: number | null;
        weightUsed: number | null;
        completed: boolean;
      }>;
    }>;
    startedAt: Date;
    finishedAt: Date | null;
  }): WorkoutSessionResponseDto {
    const response = new WorkoutSessionResponseDto();
    response.id = result.id;
    response.userId = result.userId;
    response.routineId = result.routineId;
    response.status = result.status;
    response.currentExerciseIndex = result.currentExerciseIndex;
    response.exercises = result.exercises.map((ex) => {
      const exDto = new WorkoutExerciseResponseDto();
      exDto.exerciseId = ex.exerciseId;
      exDto.exerciseName = ex.exerciseName;
      exDto.order = ex.order;
      exDto.sets = ex.sets;
      exDto.repsPerSet = ex.repsPerSet;
      exDto.weight = ex.weight;
      exDto.workoutSets = ex.workoutSets.map((ws) => {
        const wsDto = new WorkoutSetResponseDto();
        wsDto.setNumber = ws.setNumber;
        wsDto.repsPerformed = ws.repsPerformed;
        wsDto.weightUsed = ws.weightUsed;
        wsDto.completed = ws.completed;
        return wsDto;
      });
      return exDto;
    });
    response.startedAt = result.startedAt;
    response.finishedAt = result.finishedAt;
    return response;
  }
}
