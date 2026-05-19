import {
  Controller,
  Post,
  Delete,
  Get,
  Patch,
  Body,
  Param,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { CreateRoutineUseCase } from '../../../application/use-cases/create-routine/create-routine.use-case';
import { AddExerciseToRoutineDayUseCase } from '../../../application/use-cases/add-exercise-to-routine-day/add-exercise-to-routine-day.use-case';
import { RemoveExerciseFromRoutineUseCase } from '../../../application/use-cases/remove-exercise-from-routine/remove-exercise-from-routine.use-case';
import { ConfigureExerciseUseCase } from '../../../application/use-cases/configure-exercise/configure-exercise.use-case';
import { ActivateRoutineUseCase } from '../../../application/use-cases/activate-routine/activate-routine.use-case';
import { DeactivateRoutineUseCase } from '../../../application/use-cases/deactivate-routine/deactivate-routine.use-case';
import { ListRoutinesUseCase } from '../../../application/use-cases/list-routines/list-routines.use-case';
import { GetRoutineDetailUseCase } from '../../../application/use-cases/get-routine-detail/get-routine-detail.use-case';
import { DeleteRoutineUseCase } from '../../../application/use-cases/delete-routine/delete-routine.use-case';
import { SyncRoutineUseCase } from '../../../application/use-cases/sync-routine/sync-routine.use-case';
import { SetRoutineTrainingStrategyUseCase } from '../../../application/use-cases/set-routine-training-strategy/set-routine-training-strategy.use-case';
import { GenerateExerciseSetsUseCase } from '../../../application/use-cases/generate-exercise-sets/generate-exercise-sets.use-case';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { CreateRoutineRequestDto } from '../dtos/create-routine.request';
import { AddExerciseRequestDto } from '../dtos/add-exercise.request';
import { ConfigureExerciseRequestDto } from '../dtos/configure-exercise.request';
import { SyncRoutineRequestDto } from '../dtos/sync-routine.request';
import { SetTrainingStrategyRequestDto } from '../dtos/set-training-strategy.request';
import { GenerateExerciseSetsRequestDto } from '../dtos/generate-exercise-sets.request';
import {
  RoutineResponseDto,
  RoutineDayResponseDto,
  ExerciseResponseDto,
  ExerciseSetResponseDto,
} from '../dtos/routine.response';
import { DeleteRoutineResponseDto } from '../dtos/delete-routine.response';
import { isValidDayOfWeek } from '../../../domain/value-objects/routine-day.value-object';
import { RoutineDomainErrorFilter } from '../filters/routine-domain-error.filter';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';

@Controller('routines')
@UseGuards(JwtAuthGuard)
@UseFilters(RoutineDomainErrorFilter)
export class RoutineController {
  constructor(
    private readonly createRoutineUseCase: CreateRoutineUseCase,
    private readonly addExerciseUseCase: AddExerciseToRoutineDayUseCase,
    private readonly removeExerciseUseCase: RemoveExerciseFromRoutineUseCase,
    private readonly configureExerciseUseCase: ConfigureExerciseUseCase,
    private readonly activateRoutineUseCase: ActivateRoutineUseCase,
    private readonly deactivateRoutineUseCase: DeactivateRoutineUseCase,
    private readonly listRoutinesUseCase: ListRoutinesUseCase,
    private readonly getRoutineDetailUseCase: GetRoutineDetailUseCase,
    private readonly deleteRoutineUseCase: DeleteRoutineUseCase,
    private readonly syncRoutineUseCase: SyncRoutineUseCase,
    private readonly setRoutineTrainingStrategyUseCase: SetRoutineTrainingStrategyUseCase,
    private readonly generateExerciseSetsUseCase: GenerateExerciseSetsUseCase,
  ) {}

  private getActor(user: JwtPayload): CurrentActor {
    return { userId: user.sub };
  }

  @Get()
  public async list(
    @CurrentUser() user: JwtPayload,
  ): Promise<RoutineResponseDto[]> {
    const results = await this.listRoutinesUseCase.execute(this.getActor(user));
    return results.map((r) => this.mapToResponse(r));
  }

  @Get(':routineId')
  public async getDetail(
    @CurrentUser() user: JwtPayload,
    @Param('routineId') routineId: string,
  ): Promise<RoutineResponseDto> {
    const result = await this.getRoutineDetailUseCase.execute(
      this.getActor(user),
      { routineId },
    );
    return this.mapToResponse(result);
  }

  @Post()
  public async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRoutineRequestDto,
  ): Promise<RoutineResponseDto> {
    const result = await this.createRoutineUseCase.execute(
      this.getActor(user),
      {
        name: dto.name,
        dayOfWeeks: dto.dayOfWeeks,
      },
    );

    return this.mapToResponse(result);
  }

  @Post(':routineId/days/:dayOfWeek/exercises')
  public async addExercise(
    @CurrentUser() user: JwtPayload,
    @Param('routineId') routineId: string,
    @Param('dayOfWeek') dayOfWeek: string,
    @Body() dto: AddExerciseRequestDto,
  ): Promise<RoutineResponseDto> {
    // Validate dayOfWeek at controller boundary
    if (!isValidDayOfWeek(dayOfWeek)) {
      throw new Error(`Invalid day of week: ${dayOfWeek}`);
    }

    const result = await this.addExerciseUseCase.execute(this.getActor(user), {
      routineId,
      dayOfWeek,
      name: dto.name,
      order: dto.order,
    });

    return this.mapToResponse(result);
  }

  @Delete(':routineId/days/:dayOfWeek/exercises/:exerciseId')
  public async removeExercise(
    @CurrentUser() user: JwtPayload,
    @Param('routineId') routineId: string,
    @Param('dayOfWeek') dayOfWeek: string,
    @Param('exerciseId') exerciseId: string,
  ): Promise<RoutineResponseDto> {
    // Validate dayOfWeek at controller boundary
    if (!isValidDayOfWeek(dayOfWeek)) {
      throw new Error(`Invalid day of week: ${dayOfWeek}`);
    }

    const result = await this.removeExerciseUseCase.execute(
      this.getActor(user),
      {
        routineId,
        dayOfWeek,
        exerciseId,
      },
    );

    return this.mapToResponse(result);
  }

  @Patch(':routineId/days/:dayOfWeek/exercises/:exerciseId')
  public async configureExercise(
    @CurrentUser() user: JwtPayload,
    @Param('routineId') routineId: string,
    @Param('dayOfWeek') dayOfWeek: string,
    @Param('exerciseId') exerciseId: string,
    @Body() dto: ConfigureExerciseRequestDto,
  ): Promise<RoutineResponseDto> {
    // Validate dayOfWeek at controller boundary
    if (!isValidDayOfWeek(dayOfWeek)) {
      throw new Error(`Invalid day of week: ${dayOfWeek}`);
    }

    const result = await this.configureExerciseUseCase.execute(
      this.getActor(user),
      {
        routineId,
        dayOfWeek,
        exerciseId,
        sets: dto.sets,
      },
    );

    return this.mapToResponse(result);
  }

  @Patch(':routineId/activate')
  public async activate(
    @CurrentUser() user: JwtPayload,
    @Param('routineId') routineId: string,
  ): Promise<RoutineResponseDto> {
    const result = await this.activateRoutineUseCase.execute(
      this.getActor(user),
      { routineId },
    );

    return this.mapToResponse(result);
  }

  @Patch(':routineId/deactivate')
  public async deactivate(
    @CurrentUser() user: JwtPayload,
    @Param('routineId') routineId: string,
  ): Promise<RoutineResponseDto> {
    const result = await this.deactivateRoutineUseCase.execute(
      this.getActor(user),
      { routineId },
    );

    return this.mapToResponse(result);
  }

  @Delete(':routineId')
  public async delete(
    @CurrentUser() user: JwtPayload,
    @Param('routineId') routineId: string,
  ): Promise<DeleteRoutineResponseDto> {
    const result = await this.deleteRoutineUseCase.execute(
      this.getActor(user),
      {
        routineId,
      },
    );

    const response = new DeleteRoutineResponseDto();
    response.id = result.id;
    response.deleted = result.deleted;
    return response;
  }

  @Patch(':routineId/sync')
  public async sync(
    @CurrentUser() user: JwtPayload,
    @Param('routineId') routineId: string,
    @Body() dto: SyncRoutineRequestDto,
  ): Promise<RoutineResponseDto> {
    const result = await this.syncRoutineUseCase.execute(this.getActor(user), {
      routineId,
      days: dto.days,
    });

    return this.mapToResponse(result);
  }

  @Patch(':routineId/training-strategy')
  public async setTrainingStrategy(
    @CurrentUser() user: JwtPayload,
    @Param('routineId') routineId: string,
    @Body() dto: SetTrainingStrategyRequestDto,
  ): Promise<RoutineResponseDto> {
    const result = await this.setRoutineTrainingStrategyUseCase.execute(
      this.getActor(user),
      {
        routineId,
        strategyKey: dto.strategyKey ?? null,
      },
    );

    return this.mapToResponse(result);
  }

  @Post(':routineId/generate-sets')
  public async generateSets(
    @CurrentUser() user: JwtPayload,
    @Param('routineId') routineId: string,
    @Body() dto: GenerateExerciseSetsRequestDto,
  ): Promise<{
    sets: Array<{ setNumber: number; reps: number; weight: number }>;
  }> {
    const result = await this.generateExerciseSetsUseCase.execute({
      strategyKey: dto.strategyKey ?? null,
      numberOfSets: dto.numberOfSets,
      initialWeight: dto.initialWeight,
      initialReps: dto.initialReps,
    });

    return { sets: result.sets };
  }

  private mapToResponse(result: {
    id: string;
    name: string;
    userId: string;
    isActive: boolean;
    trainingStrategyKey?: string | null;
    days: Array<{
      dayOfWeek: string;
      exercises: Array<{
        id: string;
        name: string;
        order: number;
        sets: Array<{
          id: string;
          setNumber: number;
          reps: number;
          weight: number;
          restSeconds: number | null;
        }>;
      }>;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): RoutineResponseDto {
    const response = new RoutineResponseDto();
    response.id = result.id;
    response.name = result.name;
    response.userId = result.userId;
    response.isActive = result.isActive;
    response.trainingStrategyKey = result.trainingStrategyKey ?? null;
    response.dayOfWeeks = result.days.map((d) => d.dayOfWeek);
    response.days = result.days.map((d) => {
      const dayDto = new RoutineDayResponseDto();
      dayDto.dayOfWeek = d.dayOfWeek;
      dayDto.exercises = d.exercises.map((e) => {
        const exDto = new ExerciseResponseDto();
        exDto.id = e.id;
        exDto.name = e.name;
        exDto.order = e.order;
        exDto.sets = e.sets.map((s) => {
          const setDto = new ExerciseSetResponseDto();
          setDto.id = s.id;
          setDto.setNumber = s.setNumber;
          setDto.reps = s.reps;
          setDto.weight = s.weight;
          setDto.restSeconds = s.restSeconds;
          return setDto;
        });
        return exDto;
      });
      return dayDto;
    });
    response.createdAt = result.createdAt;
    response.updatedAt = result.updatedAt;
    return response;
  }
}
