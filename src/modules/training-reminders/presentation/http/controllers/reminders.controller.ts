import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import type { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { CreateReminderUseCase } from '../../../application/use-cases/create-reminder/create-reminder.use-case';
import { ListRemindersUseCase } from '../../../application/use-cases/list-reminders/list-reminders.use-case';
import { EditReminderUseCase } from '../../../application/use-cases/edit-reminder/edit-reminder.use-case';
import { DeleteReminderUseCase } from '../../../application/use-cases/delete-reminder/delete-reminder.use-case';
import { CreateReminderRequestDto } from '../dtos/create-reminder.dto';
import { CreateReminderResponseDto } from '../dtos/create-reminder.response';
import { EditReminderRequestDto } from '../dtos/edit-reminder.dto';
import { ReminderResponseDto } from '../dtos/reminder-response.dto';
import { ReminderDomainErrorFilter } from '../filters/reminder-domain-error.filter';

@Controller('training-reminders')
@UseGuards(JwtAuthGuard)
@UseFilters(ReminderDomainErrorFilter)
export class RemindersController {
  constructor(
    private readonly createReminderUseCase: CreateReminderUseCase,
    private readonly listRemindersUseCase: ListRemindersUseCase,
    private readonly editReminderUseCase: EditReminderUseCase,
    private readonly deleteReminderUseCase: DeleteReminderUseCase,
  ) {}

  @Post()
  public async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReminderRequestDto,
  ): Promise<CreateReminderResponseDto> {
    const result = await this.createReminderUseCase.execute(
      { userId: user.sub, role: user.role ?? 'client' },
      {
        routineId: dto.routineId,
        dayOfWeek: dto.dayOfWeek,
        time: dto.time,
        timezone: dto.timezone ?? 'America/Mexico_City',
      },
    );

    const response = new CreateReminderResponseDto();
    response.id = result.id;
    response.routineName = result.routineName;
    response.dayOfWeek = result.dayOfWeek;
    response.time = result.time;
    response.status = result.status;
    response.nextActivationAt = result.nextActivationAt;
    return response;
  }

  @Get()
  public async list(
    @CurrentUser() user: JwtPayload,
  ): Promise<ReminderResponseDto[]> {
    const results = await this.listRemindersUseCase.execute({
      userId: user.sub,
      role: user.role ?? 'client',
    });

    return results.map((r) => {
      const dto = new ReminderResponseDto();
      dto.id = r.id;
      dto.routineId = r.routineId;
      dto.routineName = r.routineName;
      dto.dayOfWeek = r.dayOfWeek;
      dto.time = r.time;
      dto.status = r.status;
      dto.nextActivationAt = r.nextActivationAt;
      dto.createdAt = r.createdAt;
      dto.updatedAt = r.updatedAt;
      return dto;
    });
  }

  @Patch(':id')
  public async edit(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: EditReminderRequestDto,
  ): Promise<CreateReminderResponseDto> {
    const result = await this.editReminderUseCase.execute(
      { userId: user.sub, role: user.role ?? 'client' },
      {
        reminderId: id,
        dayOfWeek: dto.dayOfWeek,
        time: dto.time,
      },
    );

    const response = new CreateReminderResponseDto();
    response.id = result.id;
    response.routineName = result.routineName;
    response.dayOfWeek = result.dayOfWeek;
    response.time = result.time;
    response.status = result.status;
    response.nextActivationAt = result.nextActivationAt;
    return response;
  }

  @Delete(':id')
  public async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.deleteReminderUseCase.execute(
      { userId: user.sub, role: user.role ?? 'client' },
      { reminderId: id },
    );
  }
}
