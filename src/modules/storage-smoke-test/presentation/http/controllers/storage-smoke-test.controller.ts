import { Controller, ForbiddenException, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../../auth/presentation/http/decorators/public.decorator';
import {
  UploadRootPdfSmokeTestResult,
  UploadRootPdfSmokeTestUseCase,
} from '../../../application/use-cases/upload-root-pdf-smoke-test.use-case';

@Controller('storage-smoke-test')
export class StorageSmokeTestController {
  constructor(
    private readonly uploadRootPdfSmokeTest: UploadRootPdfSmokeTestUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('root-pdf')
  async uploadRootPdf(): Promise<UploadRootPdfSmokeTestResult> {
    if (
      this.configService.get<string>('STORAGE_SMOKE_TEST_ENABLED') !== 'true'
    ) {
      throw new ForbiddenException(
        'Storage smoke test deshabilitado. Activa STORAGE_SMOKE_TEST_ENABLED=true para usar este endpoint.',
      );
    }

    return this.uploadRootPdfSmokeTest.execute();
  }
}
