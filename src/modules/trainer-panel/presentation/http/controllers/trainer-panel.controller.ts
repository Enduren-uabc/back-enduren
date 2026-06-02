import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { TrainerVerifiedGuard } from '../../../../trainer-verification/presentation/http/guards/trainer-verified.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { ActiveLinkGuard } from '../../../infrastructure/guards/active-link.guard';
import { AssignRoutineRequestDto } from '../dtos/assign-routine-request.dto';
import { ReplaceRoutineRequestDto } from '../dtos/replace-routine-request.dto';
import { UpdateNotesRequestDto } from '../dtos/update-notes-request.dto';
import { EditAssignedRoutineContentRequestDto } from '../dtos/edit-assigned-routine-content-request.dto';
import { StartAssignedRoutineWorkoutRequestDto } from '../dtos/start-assigned-routine-workout-request.dto';
import {
  AssignedRoutineResponseDto,
  AssignedRoutineListItemDto,
  MyAssignedRoutineItemDto,
} from '../dtos/assigned-routine-response.dto';
import { GetAssignableRoutinesUseCase } from '../../../application/use-cases/get-assignable-routines/get-assignable-routines.use-case';
import { AssignRoutineToClientUseCase } from '../../../application/use-cases/assign-routine-to-client/assign-routine-to-client.use-case';
import { GetClientAssignedRoutinesUseCase } from '../../../application/use-cases/get-client-assigned-routines/get-client-assigned-routines.use-case';
import { GetMyAssignedRoutinesUseCase } from '../../../application/use-cases/get-my-assigned-routines/get-my-assigned-routines.use-case';
import { ReplaceAssignedRoutineUseCase } from '../../../application/use-cases/replace-assigned-routine/replace-assigned-routine.use-case';
import { UpdateAssignedRoutineNotesUseCase } from '../../../application/use-cases/update-assigned-routine-notes/update-assigned-routine-notes.use-case';
import { GetAssignedRoutineDetailUseCase } from '../../../application/use-cases/get-assigned-routine-detail/get-assigned-routine-detail.use-case';
import { EditAssignedRoutineContentUseCase } from '../../../application/use-cases/edit-assigned-routine-content/edit-assigned-routine-content.use-case';
import {
  StartAssignedRoutineWorkoutUseCase,
  type StartAssignedRoutineWorkoutInput,
} from '../../../application/use-cases/start-assigned-routine-workout/start-assigned-routine-workout.use-case';
import type { StartWorkoutSessionOutput } from '../../../../training/application/use-cases/start-workout-session/start-workout-session.use-case';

@Controller('trainer')
@UseGuards(JwtAuthGuard, TrainerVerifiedGuard)
export class TrainerPanelController {
  constructor(
    private readonly getAssignableRoutinesUseCase: GetAssignableRoutinesUseCase,
    private readonly assignRoutineToClientUseCase: AssignRoutineToClientUseCase,
    private readonly getClientAssignedRoutinesUseCase: GetClientAssignedRoutinesUseCase,
    private readonly replaceAssignedRoutineUseCase: ReplaceAssignedRoutineUseCase,
    private readonly updateAssignedRoutineNotesUseCase: UpdateAssignedRoutineNotesUseCase,
    private readonly getAssignedRoutineDetailUseCase: GetAssignedRoutineDetailUseCase,
    private readonly editAssignedRoutineContentUseCase: EditAssignedRoutineContentUseCase,
  ) {}

  @Get('clients/:clientId/routines/assignable')
  @UseGuards(ActiveLinkGuard)
  async getAssignableRoutines(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
  ): Promise<{
    items: Array<{
      id: string;
      name: string;
      description: string;
      difficulty: string;
      estimatedDuration: number;
      exerciseCount: number;
      isActive: boolean;
      targetAudience: 'client';
    }>;
  }> {
    const result = await this.getAssignableRoutinesUseCase.execute({
      trainerId: user.sub,
      clientId,
    });
    return { items: result.items };
  }

  @Post('clients/:clientId/assigned-routine')
  @UseGuards(ActiveLinkGuard)
  async assignRoutine(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
    @Body() dto: AssignRoutineRequestDto,
  ): Promise<AssignedRoutineResponseDto> {
    const result = await this.assignRoutineToClientUseCase.execute({
      trainerId: user.sub,
      clientId,
      routineId: dto.routineId,
      notes: dto.notes,
    });

    return {
      id: result.id,
      clientId: result.clientId,
      trainerId: result.trainerId,
      routineId: result.routineId,
      routineSnapshot: result.routineSnapshot,
      status: result.status,
      assignedAt: result.assignedAt,
      notes: result.notes,
      replacedById: null,
    };
  }

  @Get('clients/:clientId/assigned-routine')
  @UseGuards(ActiveLinkGuard)
  async getClientAssignedRoutines(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
  ): Promise<{ items: AssignedRoutineListItemDto[] }> {
    const result = await this.getClientAssignedRoutinesUseCase.execute({
      trainerId: user.sub,
      clientId,
    });
    return { items: result.items };
  }

  @Get('clients/:clientId/assigned-routine/:assignedId/detail')
  @UseGuards(ActiveLinkGuard)
  async getAssignedRoutineDetail(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
    @Param('assignedId') assignedId: string,
  ): Promise<{
    id: string;
    routineId: string;
    routineName: string;
    description: string;
    difficulty: string;
    estimatedDuration: number;
    status: string;
    assignedAt: Date;
    notes: string | null;
    originLabel: string;
    days: Array<{
      dayOfWeek: string;
      exercises: Array<{
        exerciseId: string;
        name: string;
        sets: number;
        reps: number;
        restSeconds: number;
        order: number;
      }>;
    }>;
  }> {
    return this.getAssignedRoutineDetailUseCase.execute({
      trainerId: user.sub,
      clientId,
      assignedId,
    });
  }

  @Put('clients/:clientId/assigned-routine/:assignedId/replace')
  @UseGuards(ActiveLinkGuard)
  async replaceRoutine(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
    @Param('assignedId') assignedId: string,
    @Body() dto: ReplaceRoutineRequestDto,
  ): Promise<AssignedRoutineResponseDto> {
    const result = await this.replaceAssignedRoutineUseCase.execute({
      trainerId: user.sub,
      clientId,
      assignedId,
      newRoutineId: dto.newRoutineId,
      notes: dto.notes,
    });

    return {
      id: result.id,
      clientId: result.clientId,
      trainerId: result.trainerId,
      routineId: result.routineId,
      routineSnapshot: result.routineSnapshot,
      status: result.status,
      assignedAt: result.assignedAt,
      notes: result.notes,
      replacedById: null,
    };
  }

  @Patch('clients/:clientId/assigned-routine/:assignedId/content')
  @UseGuards(ActiveLinkGuard)
  async editAssignedRoutineContent(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
    @Param('assignedId') assignedId: string,
    @Body() dto: EditAssignedRoutineContentRequestDto,
  ): Promise<AssignedRoutineResponseDto> {
    const result = await this.editAssignedRoutineContentUseCase.execute({
      trainerId: user.sub,
      clientId,
      assignedId,
      name: dto.name,
      days: dto.days,
    });

    return {
      id: result.id,
      clientId: result.clientId,
      trainerId: result.trainerId,
      routineId: result.routineId,
      routineSnapshot: result.routineSnapshot,
      status: result.status,
      assignedAt: result.assignedAt,
      notes: result.notes,
      replacedById: null,
    };
  }

  @Patch('clients/:clientId/assigned-routine/:assignedId/notes')
  @UseGuards(ActiveLinkGuard)
  async updateNotes(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
    @Param('assignedId') assignedId: string,
    @Body() dto: UpdateNotesRequestDto,
  ): Promise<{ id: string; notes: string | null }> {
    return this.updateAssignedRoutineNotesUseCase.execute({
      trainerId: user.sub,
      clientId,
      assignedId,
      notes: dto.notes,
    });
  }
}

@Controller('client')
@UseGuards(JwtAuthGuard)
export class ClientAssignedRoutineController {
  constructor(
    private readonly getMyAssignedRoutinesUseCase: GetMyAssignedRoutinesUseCase,
    private readonly startAssignedRoutineWorkoutUseCase: StartAssignedRoutineWorkoutUseCase,
  ) {}

  @Get('assigned-routine')
  async getMyAssignedRoutines(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ items: MyAssignedRoutineItemDto[] }> {
    const result = await this.getMyAssignedRoutinesUseCase.execute({
      clientId: user.sub,
    });
    return { items: result.items };
  }

  @Post('assigned-routine/:assignedId/start')
  async startAssignedRoutineWorkout(
    @CurrentUser() user: JwtPayload,
    @Param('assignedId') assignedId: string,
    @Body() dto: StartAssignedRoutineWorkoutRequestDto,
  ): Promise<StartWorkoutSessionOutput> {
    const input: StartAssignedRoutineWorkoutInput = {
      clientId: user.sub,
      assignedId,
      dayOfWeek: dto.dayOfWeek,
    };
    return this.startAssignedRoutineWorkoutUseCase.execute(input);
  }
}
