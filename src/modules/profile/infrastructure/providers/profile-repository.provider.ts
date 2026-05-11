import { Provider } from '@nestjs/common';
import { PROFILE_REPOSITORY_PORT } from '../../domain/repositories/profile.repository';
import { TypeormProfileRepository } from '../persistence/typeorm/repositories/typeorm-profile.repository';

export const profileRepositoryProvider: Provider = {
  provide: PROFILE_REPOSITORY_PORT,
  useClass: TypeormProfileRepository,
};
