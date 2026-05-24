import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  StartWorkoutSessionUseCase,
  StartWorkoutSessionInput,
} from '../../../application/use-cases/start-workout-session/start-workout-session.use-case';
import { FinishWorkoutSessionUseCase } from '../../../application/use-cases/finish-workout-session/finish-workout-session.use-case';
import { ResumeWorkoutSessionUseCase } from '../../../application/use-cases/resume-workout-session/resume-workout-session.use-case';
import { GetWorkoutSessionUseCase } from '../../../application/use-cases/get-workout-session/get-workout-session.use-case';
import { GetWorkoutSessionHistoryUseCase } from '../../../application/use-cases/get-workout-session-history/get-workout-session-history.use-case';
import { GetWorkoutSessionDetailUseCase } from '../../../application/use-cases/get-workout-session-detail/get-workout-session-detail.use-case';
import { GetExerciseProgressUseCase } from '../../../application/use-cases/get-exercise-progress/get-exercise-progress.use-case';
import { DiscardWorkoutSessionUseCase } from '../../../application/use-cases/discard-workout-session/discard-workout-session.use-case';
import { RegisterSetRepsAndWeightUseCase } from '../../../application/use-cases/register-set-reps-and-weight/register-set-reps-and-weight.use-case';
import { MarkSetAsCompletedUseCase } from '../../../application/use-cases/mark-set-as-completed/mark-set-as-completed.use-case';
import { AdvanceToNextExerciseUseCase } from '../../../application/use-cases/advance-to-next-exercise/advance-to-next-exercise.use-case';
import { AddSetToExerciseUseCase } from '../../../application/use-cases/add-set-to-exercise/add-set-to-exercise.use-case';
import { RemoveSetFromExerciseUseCase } from '../../../application/use-cases/remove-set-from-exercise/remove-set-from-exercise.use-case';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { StartWorkoutSessionRequestDto } from '../dtos/start-workout-session.request';
import { AdvanceWorkoutSessionRequestDto } from '../dtos/advance-workout-session.request';
import { RegisterSetRepsAndWeightRequestDto } from '../dtos/register-set-reps-and-weight.request';
import { AddWorkoutSetRequestDto } from '../dtos/add-workout-set.request';
import {
  WorkoutSessionResponseDto,
  WorkoutSessionDetailResponseDto,
  WorkoutExerciseResponseDto,
  WorkoutSetResponseDto,
  WorkoutExerciseTargetSetResponseDto,
} from '../dtos/workout-session.response';
import { WorkoutSessionSummaryResponseDto } from '../dtos/workout-session-summary.response';
import { WorkoutSessionHistoryResponseDto } from '../dtos/workout-session-history.response';
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
  constructor(
    private readonly startWorkoutSessionUseCase: StartWorkoutSessionUseCase,
    private readonly finishWorkoutSessionUseCase: FinishWorkoutSessionUseCase,
    private readonly resumeWorkoutSessionUseCase: ResumeWorkoutSessionUseCase,
    private readonly getWorkoutSessionUseCase: GetWorkoutSessionUseCase,
    private readonly getWorkoutSessionHistoryUseCase: GetWorkoutSessionHistoryUseCase,
    private readonly getWorkoutSessionDetailUseCase: GetWorkoutSessionDetailUseCase,
    private readonly getExerciseProgressUseCase: GetExerciseProgressUseCase,
    private readonly discardWorkoutSessionUseCase: DiscardWorkoutSessionUseCase,
    private readonly registerSetRepsAndWeightUseCase: RegisterSetRepsAndWeightUseCase,
    private readonly markSetAsCompletedUseCase: MarkSetAsCompletedUseCase,
    private readonly advanceToNextExerciseUseCase: AdvanceToNextExerciseUseCase,
    private readonly addSetToExerciseUseCase: AddSetToExerciseUseCase,
    private readonly removeSetFromExerciseUseCase: RemoveSetFromExerciseUseCase,
  ) {}

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
      dayOfWeek: dto.dayOfWeek,
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
  ): Promise<WorkoutSessionResponseDto | null> {
    const result = await this.resumeWorkoutSessionUseCase.execute(
      this.getActor(user),
    );
    if (!result) {
      return null;
    }
    return this.mapToResponse(result);
  }

  @Get('history')
  public async history(
    @CurrentUser() user: JwtPayload,
  ): Promise<WorkoutSessionHistoryResponseDto> {
    const result = await this.getWorkoutSessionHistoryUseCase.execute(
      this.getActor(user),
    );
    const dto = new WorkoutSessionHistoryResponseDto();
    dto.sessions = result.sessions.map((r) => {
      const s = new WorkoutSessionSummaryResponseDto();
      s.id = r.id;
      s.routineId = r.routineId;
      s.routineName = r.routineName ?? 'Unknown Routine';
      s.dayOfWeek = r.dayOfWeek;
      s.startedAt = r.startedAt;
      s.finishedAt = r.finishedAt;
      s.durationMinutes = r.durationMinutes;
      s.exerciseCount = r.exerciseCount;
      s.status = r.status;
      return s;
    });
    dto.hasIncompleteData = result.hasIncompleteData;
    return dto;
  }

  @Patch(':sessionId/discard')
  public async discard(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.discardWorkoutSessionUseCase.execute(
      this.getActor(user),
      { sessionId },
    );
    return this.mapToResponse(result);
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
    @Param('exerciseIndex', ParseIntPipe) exerciseIndex: number,
    @Param('setNumber', ParseIntPipe) setNumber: number,
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
    @Param('exerciseIndex', ParseIntPipe) exerciseIndex: number,
    @Param('setNumber', ParseIntPipe) setNumber: number,
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
    @Body() dto: AdvanceWorkoutSessionRequestDto = {},
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.advanceToNextExerciseUseCase.execute(
      this.getActor(user),
      { sessionId, allowIncomplete: dto.allowIncomplete === true },
    );
    return this.mapToResponse(result);
  }

  @Post(':sessionId/exercises/:exerciseIndex/sets')
  public async addSetToExercise(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Param('exerciseIndex', ParseIntPipe) exerciseIndex: number,
    @Body() dto: AddWorkoutSetRequestDto,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.addSetToExerciseUseCase.execute(
      this.getActor(user),
      { sessionId, exerciseIndex, reps: dto.reps, weight: dto.weight },
    );
    return this.mapToResponse(result);
  }

  @Delete(':sessionId/exercises/:exerciseIndex/sets/:setNumber')
  public async removeSetFromExercise(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Param('exerciseIndex', ParseIntPipe) exerciseIndex: number,
    @Param('setNumber', ParseIntPipe) setNumber: number,
  ): Promise<WorkoutSessionResponseDto> {
    const result = await this.removeSetFromExerciseUseCase.execute(
      this.getActor(user),
      { sessionId, exerciseIndex, setNumber },
    );
    return this.mapToResponse(result);
  }

  private mapToResponse(result: {
    id: string;
    userId: string;
    routineId: string;
    dayOfWeek: string;
    status: string;
    currentExerciseIndex: number;
    exercises: Array<{
      exerciseId: string;
      exerciseName: string;
      order: number;
      targetSets: Array<{
        setNumber: number;
        reps: number;
        weight: number;
      }>;
      workoutSets: Array<{
        setNumber: number;
        repsPerformed: number | null;
        weightUsed: number | null;
        targetReps: number | null;
        targetWeight: number | null;
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
    response.dayOfWeek = result.dayOfWeek;
    response.status = result.status;
    response.currentExerciseIndex = result.currentExerciseIndex;
    response.exercises = result.exercises.map((ex) => {
      const exDto = new WorkoutExerciseResponseDto();
      exDto.exerciseId = ex.exerciseId;
      exDto.exerciseName = ex.exerciseName;
      exDto.order = ex.order;
      exDto.targetSets = ex.targetSets.map((ts) => {
        const tsDto = new WorkoutExerciseTargetSetResponseDto();
        tsDto.setNumber = ts.setNumber;
        tsDto.reps = ts.reps;
        tsDto.weight = ts.weight;
        return tsDto;
      });
      exDto.workoutSets = ex.workoutSets.map((ws) => {
        const wsDto = new WorkoutSetResponseDto();
        wsDto.setNumber = ws.setNumber;
        wsDto.repsPerformed = ws.repsPerformed;
        wsDto.weightUsed = ws.weightUsed;
        wsDto.targetReps = ws.targetReps;
        wsDto.targetWeight = ws.targetWeight;
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
    dayOfWeek: string;
    routineName: string;
    status: string;
    currentExerciseIndex: number;
    exercises: Array<{
      exerciseId: string;
      exerciseName: string;
      order: number;
      targetSets: Array<{
        setNumber: number;
        reps: number;
        weight: number;
      }>;
      workoutSets: Array<{
        setNumber: number;
        repsPerformed: number | null;
        weightUsed: number | null;
        targetReps: number | null;
        targetWeight: number | null;
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
    response.dayOfWeek = result.dayOfWeek;
    response.routineName = result.routineName;
    response.status = result.status;
    response.currentExerciseIndex = result.currentExerciseIndex;
    response.exercises = result.exercises.map((ex) => {
      const exDto = new WorkoutExerciseResponseDto();
      exDto.exerciseId = ex.exerciseId;
      exDto.exerciseName = ex.exerciseName;
      exDto.order = ex.order;
      exDto.targetSets = ex.targetSets.map((ts) => {
        const tsDto = new WorkoutExerciseTargetSetResponseDto();
        tsDto.setNumber = ts.setNumber;
        tsDto.reps = ts.reps;
        tsDto.weight = ts.weight;
        return tsDto;
      });
      exDto.workoutSets = ex.workoutSets.map((ws) => {
        const wsDto = new WorkoutSetResponseDto();
        wsDto.setNumber = ws.setNumber;
        wsDto.repsPerformed = ws.repsPerformed;
        wsDto.weightUsed = ws.weightUsed;
        wsDto.targetReps = ws.targetReps;
        wsDto.targetWeight = ws.targetWeight;
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
