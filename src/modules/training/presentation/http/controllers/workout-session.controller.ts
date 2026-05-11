import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Inject,
  UseFilters,
  UseGuards,
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
import { GetWorkoutSessionHistoryUseCase } from '../../../application/use-cases/get-workout-session-history/get-workout-session-history.use-case';
import { GetWorkoutSessionDetailUseCase } from '../../../application/use-cases/get-workout-session-detail/get-workout-session-detail.use-case';
import { GetExerciseProgressUseCase } from '../../../application/use-cases/get-exercise-progress/get-exercise-progress.use-case';
import { RegisterSetRepsAndWeightUseCase } from '../../../application/use-cases/register-set-reps-and-weight/register-set-reps-and-weight.use-case';
import { MarkSetAsCompletedUseCase } from '../../../application/use-cases/mark-set-as-completed/mark-set-as-completed.use-case';
import { AdvanceToNextExerciseUseCase } from '../../../application/use-cases/advance-to-next-exercise/advance-to-next-exercise.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { StartWorkoutSessionRequestDto } from '../dtos/start-workout-session.request';
import { RegisterSetRepsAndWeightRequestDto } from '../dtos/register-set-reps-and-weight.request';
import {
  WorkoutSessionResponseDto,
  WorkoutSessionDetailResponseDto,
  WorkoutExerciseResponseDto,
  WorkoutSetResponseDto,
} from '../dtos/workout-session.response';
import { WorkoutSessionSummaryResponseDto } from '../dtos/workout-session-summary.response';
import {
  ExerciseProgressResponseDto,
  ExerciseProgressRecordDto,
} from '../dtos/exercise-progress-response';
import { WorkoutSessionDomainErrorFilter } from '../filters/workout-session-domain-error.filter';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';

@Controller('workout-sessions')
@UseGuards(JwtAuthGuard)
@UseFilters(WorkoutSessionDomainErrorFilter)
export class WorkoutSessionController {
  private readonly startWorkoutSessionUseCase: StartWorkoutSessionUseCase;
  private readonly finishWorkoutSessionUseCase: FinishWorkoutSessionUseCase;
  private readonly resumeWorkoutSessionUseCase: ResumeWorkoutSessionUseCase;
  private readonly getWorkoutSessionUseCase: GetWorkoutSessionUseCase;
  private readonly getWorkoutSessionHistoryUseCase: GetWorkoutSessionHistoryUseCase;
  private readonly getWorkoutSessionDetailUseCase: GetWorkoutSessionDetailUseCase;
  private readonly getExerciseProgressUseCase: GetExerciseProgressUseCase;
  private readonly registerSetRepsAndWeightUseCase: RegisterSetRepsAndWeightUseCase;
  private readonly markSetAsCompletedUseCase: MarkSetAsCompletedUseCase;
  private readonly advanceToNextExerciseUseCase: AdvanceToNextExerciseUseCase;

  constructor(
    @Inject(WORKOUT_SESSION_REPOSITORY_PORT)
    workoutSessionRepository: WorkoutSessionRepository,
    @Inject(ROUTINE_REPOSITORY_PORT_FOR_SESSION)
    routineRepository: RoutineRepository,
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
    this.getWorkoutSessionHistoryUseCase = new GetWorkoutSessionHistoryUseCase(
      workoutSessionRepository,
      routineRepository,
    );
    this.getWorkoutSessionDetailUseCase = new GetWorkoutSessionDetailUseCase(
      workoutSessionRepository,
      routineRepository,
    );
    this.getExerciseProgressUseCase = new GetExerciseProgressUseCase(
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

  private getActor(user: JwtPayload): CurrentActor {
    return { userId: user.sub };
  }

  @Post()
  public async start(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartWorkoutSessionRequestDto,
  ): Promise<WorkoutSessionResponseDto> {
    const input: StartWorkoutSessionInput = {
      routineId: dto.routineId,
    };
    const result = await this.startWorkoutSessionUseCase.execute(
      this.getActor(user),
      input,
    );
    return this.mapToResponse(result);
  }

  @Patch(':sessionId/finish')
  public async finish(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.finishWorkoutSessionUseCase.execute(
      this.getActor(user),
      { sessionId },
    );
    return this.mapToResponse(result);
  }

  @Get('in-progress')
  public async resume(
    @CurrentUser() user: JwtPayload,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.resumeWorkoutSessionUseCase.execute(
      this.getActor(user),
    );
    return this.mapToResponse(result);
  }

  @Get('history')
  public async history(
    @CurrentUser() user: JwtPayload,
  ): Promise<WorkoutSessionSummaryResponseDto[]> {
    const results = await this.getWorkoutSessionHistoryUseCase.execute(
      this.getActor(user),
    );
    return results.map((r) => {
      const dto = new WorkoutSessionSummaryResponseDto();
      dto.id = r.id;
      dto.routineId = r.routineId;
      dto.routineName = r.routineName;
      dto.startedAt = r.startedAt;
      dto.finishedAt = r.finishedAt;
      dto.durationMinutes = r.durationMinutes;
      dto.exerciseCount = r.exerciseCount;
      dto.status = r.status;
      return dto;
    });
  }

  @Get('exercises/:exerciseId/progress')
  public async exerciseProgress(
    @CurrentUser() user: JwtPayload,
    @Param('exerciseId') exerciseId: string,
  ): Promise<ExerciseProgressResponseDto> {
    const result = await this.getExerciseProgressUseCase.execute(
      this.getActor(user),
      { exerciseId },
    );
    const response = new ExerciseProgressResponseDto();
    response.sufficientData = result.sufficientData;
    response.exerciseId = result.exerciseId;
    response.exerciseName = result.exerciseName;
    response.message = result.message;
    response.records = result.records.map((r) => {
      const dto = new ExerciseProgressRecordDto();
      dto.sessionId = r.sessionId;
      dto.date = r.date.toISOString();
      dto.weightUsed = r.weightUsed;
      dto.repsPerformed = r.repsPerformed;
      dto.setsCompleted = r.setsCompleted;
      dto.totalSets = r.totalSets;
      return dto;
    });
    return response;
  }

  @Get(':sessionId')
  public async get(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
  ): Promise<WorkoutSessionDetailResponseDto> {
    const result = await this.getWorkoutSessionDetailUseCase.execute(
      this.getActor(user),
      { sessionId },
    );
    return this.mapToDetailResponse(result);
  }

  @Patch(':sessionId/exercises/:exerciseIndex/sets/:setNumber')
  public async registerSetRepsAndWeight(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Param('exerciseIndex') exerciseIndex: number,
    @Param('setNumber') setNumber: number,
    @Body() dto: RegisterSetRepsAndWeightRequestDto,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.registerSetRepsAndWeightUseCase.execute(
      this.getActor(user),
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
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Param('exerciseIndex') exerciseIndex: number,
    @Param('setNumber') setNumber: number,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.markSetAsCompletedUseCase.execute(
      this.getActor(user),
      { sessionId, exerciseIndex, setNumber },
    );
    return this.mapToResponse(result);
  }

  @Post(':sessionId/advance-exercise')
  public async advanceToNextExercise(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.advanceToNextExerciseUseCase.execute(
      this.getActor(user),
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

  private mapToDetailResponse(result: {
    id: string;
    userId: string;
    routineId: string;
    routineName: string;
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
    durationMinutes: number | null;
  }): WorkoutSessionDetailResponseDto {
    const response = new WorkoutSessionDetailResponseDto();
    response.id = result.id;
    response.userId = result.userId;
    response.routineId = result.routineId;
    response.routineName = result.routineName;
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
    response.durationMinutes = result.durationMinutes;
    return response;
  }
}
