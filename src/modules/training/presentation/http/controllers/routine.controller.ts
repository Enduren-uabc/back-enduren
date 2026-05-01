import {
  Controller,
  Post,
  Delete,
  Get,
  Patch,
  Body,
  Param,
  Inject,
  UseFilters,
} from '@nestjs/common';
import {
  CreateRoutineUseCase,
  CURRENT_ACTOR_PORT,
  ROUTINE_REPOSITORY_PORT,
} from '../../../application/use-cases/create-routine/create-routine.use-case';
import { AddExerciseToRoutineDayUseCase } from '../../../application/use-cases/add-exercise-to-routine-day/add-exercise-to-routine-day.use-case';
import { RemoveExerciseFromRoutineUseCase } from '../../../application/use-cases/remove-exercise-from-routine/remove-exercise-from-routine.use-case';
import { ConfigureExerciseUseCase } from '../../../application/use-cases/configure-exercise/configure-exercise.use-case';
import { ActivateRoutineUseCase } from '../../../application/use-cases/activate-routine/activate-routine.use-case';
import { DeactivateRoutineUseCase } from '../../../application/use-cases/deactivate-routine/deactivate-routine.use-case';
import { ListRoutinesUseCase } from '../../../application/use-cases/list-routines/list-routines.use-case';
import { GetRoutineDetailUseCase } from '../../../application/use-cases/get-routine-detail/get-routine-detail.use-case';
import { DeleteRoutineUseCase } from '../../../application/use-cases/delete-routine/delete-routine.use-case';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CreateRoutineRequestDto } from '../dtos/create-routine.request';
import { AddExerciseRequestDto } from '../dtos/add-exercise.request';
import { ConfigureExerciseRequestDto } from '../dtos/configure-exercise.request';
import {
  RoutineResponseDto,
  RoutineDayResponseDto,
  ExerciseResponseDto,
} from '../dtos/routine.response';
import { ListRoutinesResponseDto } from '../dtos/list-routines.response';
import { DeleteRoutineResponseDto } from '../dtos/delete-routine.response';
import { isValidDayOfWeek } from '../../../domain/value-objects/routine-day.value-object';
import { RoutineDomainErrorFilter } from '../filters/routine-domain-error.filter';

@Controller('routines')
@UseFilters(RoutineDomainErrorFilter)
export class RoutineController {
  private readonly createRoutineUseCase: CreateRoutineUseCase;
  private readonly addExerciseUseCase: AddExerciseToRoutineDayUseCase;
  private readonly removeExerciseUseCase: RemoveExerciseFromRoutineUseCase;
  private readonly configureExerciseUseCase: ConfigureExerciseUseCase;
  private readonly activateRoutineUseCase: ActivateRoutineUseCase;
  private readonly deactivateRoutineUseCase: DeactivateRoutineUseCase;
  private readonly listRoutinesUseCase: ListRoutinesUseCase;
  private readonly getRoutineDetailUseCase: GetRoutineDetailUseCase;
  private readonly deleteRoutineUseCase: DeleteRoutineUseCase;

  constructor(
    @Inject(ROUTINE_REPOSITORY_PORT) routineRepository: RoutineRepository,
    @Inject(CURRENT_ACTOR_PORT) private readonly currentActor: CurrentActor,
  ) {
    this.createRoutineUseCase = new CreateRoutineUseCase(routineRepository);
    this.addExerciseUseCase = new AddExerciseToRoutineDayUseCase(
      routineRepository,
    );
    this.removeExerciseUseCase = new RemoveExerciseFromRoutineUseCase(
      routineRepository,
    );
    this.configureExerciseUseCase = new ConfigureExerciseUseCase(
      routineRepository,
    );
    this.activateRoutineUseCase = new ActivateRoutineUseCase(routineRepository);
    this.deactivateRoutineUseCase = new DeactivateRoutineUseCase(
      routineRepository,
    );
    this.listRoutinesUseCase = new ListRoutinesUseCase(routineRepository);
    this.getRoutineDetailUseCase = new GetRoutineDetailUseCase(
      routineRepository,
    );
    this.deleteRoutineUseCase = new DeleteRoutineUseCase(routineRepository);
  }

  @Get()
  public async list(): Promise<ListRoutinesResponseDto> {
    const results = await this.listRoutinesUseCase.execute(this.currentActor);

    const response = new ListRoutinesResponseDto();
    response.routines = results.map((r) => this.mapToResponse(r));
    return response;
  }

  @Get(':routineId')
  public async getDetail(
    @Param('routineId') routineId: string,
  ): Promise<RoutineResponseDto> {
    const result = await this.getRoutineDetailUseCase.execute(
      this.currentActor,
      { routineId },
    );
    return this.mapToResponse(result);
  }

  @Post()
  public async create(
    @Body() dto: CreateRoutineRequestDto,
  ): Promise<RoutineResponseDto> {
    const result = await this.createRoutineUseCase.execute(this.currentActor, {
      name: dto.name,
      dayOfWeeks: dto.dayOfWeeks,
    });

    return this.mapToResponse(result);
  }

  @Post(':routineId/days/:dayOfWeek/exercises')
  public async addExercise(
    @Param('routineId') routineId: string,
    @Param('dayOfWeek') dayOfWeek: string,
    @Body() dto: AddExerciseRequestDto,
  ): Promise<RoutineResponseDto> {
    // Validate dayOfWeek at controller boundary
    if (!isValidDayOfWeek(dayOfWeek)) {
      throw new Error(`Invalid day of week: ${dayOfWeek}`);
    }

    const result = await this.addExerciseUseCase.execute(this.currentActor, {
      routineId,
      dayOfWeek,
      name: dto.name,
      order: dto.order,
    });

    return this.mapToResponse(result);
  }

  @Delete(':routineId/days/:dayOfWeek/exercises/:exerciseId')
  public async removeExercise(
    @Param('routineId') routineId: string,
    @Param('dayOfWeek') dayOfWeek: string,
    @Param('exerciseId') exerciseId: string,
  ): Promise<RoutineResponseDto> {
    // Validate dayOfWeek at controller boundary
    if (!isValidDayOfWeek(dayOfWeek)) {
      throw new Error(`Invalid day of week: ${dayOfWeek}`);
    }

    const result = await this.removeExerciseUseCase.execute(this.currentActor, {
      routineId,
      dayOfWeek,
      exerciseId,
    });

    return this.mapToResponse(result);
  }

  @Patch(':routineId/days/:dayOfWeek/exercises/:exerciseId')
  public async configureExercise(
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
      this.currentActor,
      {
        routineId,
        dayOfWeek,
        exerciseId,
        sets: dto.sets,
        repsPerSet: dto.repsPerSet,
        weight: dto.weight,
      },
    );

    return this.mapToResponse(result);
  }

  @Patch(':routineId/activate')
  public async activate(
    @Param('routineId') routineId: string,
  ): Promise<RoutineResponseDto> {
    const result = await this.activateRoutineUseCase.execute(
      this.currentActor,
      { routineId },
    );

    return this.mapToResponse(result);
  }

  @Patch(':routineId/deactivate')
  public async deactivate(
    @Param('routineId') routineId: string,
  ): Promise<RoutineResponseDto> {
    const result = await this.deactivateRoutineUseCase.execute(
      this.currentActor,
      { routineId },
    );

    return this.mapToResponse(result);
  }

  @Delete(':routineId')
  public async delete(
    @Param('routineId') routineId: string,
  ): Promise<DeleteRoutineResponseDto> {
    const result = await this.deleteRoutineUseCase.execute(this.currentActor, {
      routineId,
    });

    const response = new DeleteRoutineResponseDto();
    response.id = result.id;
    response.deleted = result.deleted;
    return response;
  }

  private mapToResponse(result: {
    id: string;
    name: string;
    userId: string;
    isActive: boolean;
    days: Array<{
      dayOfWeek: string;
      exercises: Array<{
        id: string;
        name: string;
        order: number;
        sets?: number | null;
        repsPerSet?: number | null;
        weight?: number | null;
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
    response.days = result.days.map((d) => {
      const dayDto = new RoutineDayResponseDto();
      dayDto.dayOfWeek = d.dayOfWeek;
      dayDto.exercises = d.exercises.map((e) => {
        const exDto = new ExerciseResponseDto();
        exDto.id = e.id;
        exDto.name = e.name;
        exDto.order = e.order;
        exDto.sets = e.sets ?? null;
        exDto.repsPerSet = e.repsPerSet ?? null;
        exDto.weight = e.weight ?? null;
        return exDto;
      });
      return dayDto;
    });
    response.createdAt = result.createdAt;
    response.updatedAt = result.updatedAt;
    return response;
  }
}
