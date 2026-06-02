import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../domain/repositories/trainer-link.repository.port';
import {
  USER_REPOSITORY_PORT,
  UserRepository,
} from '../../../../users/domain/repositories/user.repository';
import { ROUTINE_REPOSITORY_PORT } from '../../../../training/application/use-cases/create-routine/create-routine.use-case';
import { RoutineRepository } from '../../../../training/domain/repositories/routine.repository';

export interface GetClientGeneralInfoInput {
  trainerId: string;
  clientId: string;
}

export interface GetClientGeneralInfoOutput {
  clientName: string;
  activeRoutineName: string | null;
}

@Injectable()
export class GetClientGeneralInfoUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(ROUTINE_REPOSITORY_PORT)
    private readonly routineRepository: RoutineRepository,
  ) {}

  async execute(
    input: GetClientGeneralInfoInput,
  ): Promise<GetClientGeneralInfoOutput> {
    const activeLink =
      await this.linkRepository.findActiveByTrainerIdAndClientId(
        input.trainerId,
        input.clientId,
      );
    if (!activeLink) {
      throw new ForbiddenException('No active link with this client');
    }

    const client = await this.userRepository.findById(input.clientId);
    if (!client) {
      throw new ForbiddenException('Client not found');
    }

    const activeRoutine = await this.routineRepository.findActiveByUserId(
      input.clientId,
    );

    return {
      clientName: client.username ?? 'Unknown',
      activeRoutineName: activeRoutine?.name ?? null,
    };
  }
}
