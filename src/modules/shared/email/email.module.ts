import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EMAIL_SENDER_PORT } from './domain/ports/email-sender.port';
import { AzureEmailSender } from './infrastructure/azure/azure-email-sender.provider';
import { UserRegisteredListener } from './infrastructure/listeners/user-registered.listener';
import { ResendVerificationListener } from './infrastructure/listeners/resend-verification.listener';
import { PasswordRecoveryListener } from './infrastructure/listeners/password-recovery.listener';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_SENDER_PORT,
      useClass: AzureEmailSender,
    },
    UserRegisteredListener,
    ResendVerificationListener,
    PasswordRecoveryListener,
  ],
  exports: [EMAIL_SENDER_PORT],
})
export class SharedEmailModule {}
