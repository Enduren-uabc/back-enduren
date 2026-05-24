import { ClientGeneralInfoResponseDto } from './client-general-info.response';
import { RecentSessionResponseDto } from './recent-session.response';
import { BasicIndicatorsResponseDto } from './basic-indicators.response';

export class ClientProgressResponseDto {
  generalInfo!: ClientGeneralInfoResponseDto;
  recentSessions!: RecentSessionResponseDto[];
  indicators!: BasicIndicatorsResponseDto;
}
