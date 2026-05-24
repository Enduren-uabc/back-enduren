import { HttpException, HttpStatus } from '@nestjs/common';

export class AccountLockedException extends HttpException {
  public readonly remainingLockSeconds: number;

  constructor(remainingLockSeconds: number) {
    super(
      {
        message: 'Cuenta bloqueada temporalmente por muchos intentos fallidos.',
        code: 'ACCOUNT_LOCKED',
        remainingLockSeconds,
      },
      HttpStatus.LOCKED,
    );
    this.remainingLockSeconds = remainingLockSeconds;
  }
}
