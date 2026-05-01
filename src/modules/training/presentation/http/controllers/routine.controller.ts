import { Controller, Post, Delete, Body, Param, Inject } from '@nestjs/common';
import {
  CreateRoutineUseCase,
  CURRENT_ACTOR_PORT,
  ROUTINE_REPOSITORY_PORT,
} from '../../../application/use-cases/create-routine/create-routine.use-case';
import { AddExerciseToRoutineDayUseCase } from '../../../application/use-cases/add-exercise-to-routine-day/add-exercise-to-routine-day.use-case';
import { RemoveExerciseFromRoutineUseCase } from '../../../application/use-cases/remove-exercise-from-routine/remove-exercise-from-routine.use-case';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CreateRoutineRequestDto } from '../dtos/create-routine.request';
import { AddExerciseRequestDto } from '../dtos/add-exercise.request';
import {
  RoutineResponseDto,
  RoutineDayResponseDto,
  ExerciseResponseDto,
} from '../dtos/routine.response';
import { isValidDayOfWeek } from '../../../domain/value-objects/routine-day.value-object';

@Controller('routines')
export class RoutineController {
  private readonly createRoutineUseCase: CreateRoutineUseCase;
  private readonly addExerciseUseCase: AddExerciseToRoutineDayUseCase;
  private readonly removeExerciseUseCase: RemoveExerciseFromRoutineUseCase;

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

  private mapToResponse(result: {
    id: string;
    name: string;
    userId: string;
    days: Array<{
      dayOfWeek: string;
      exercises: Array<{ id: string; name: string; order: number }>;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): RoutineResponseDto {
    const response = new RoutineResponseDto();
    response.id = result.id;
    response.name = result.name;
    response.userId = result.userId;
    response.days = result.days.map((d) => {
      const dayDto = new RoutineDayResponseDto();
      dayDto.dayOfWeek = d.dayOfWeek;
      dayDto.exercises = d.exercises.map((e) => {
        const exDto = new ExerciseResponseDto();
        exDto.id = e.id;
        exDto.name = e.name;
        exDto.order = e.order;
        return exDto;
      });
      return dayDto;
    });
    response.createdAt = result.createdAt;
    response.updatedAt = result.updatedAt;
    return response;
  }
}
