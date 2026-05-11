import { Injectable } from '@nestjs/common';
import { Response } from 'express';

export const COOKIE_HELPER_PORT = Symbol('COOKIE_HELPER_PORT');

export interface CookieHelper {
  setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void;
  clearAuthCookies(res: Response): void;
}

@Injectable()
export class AuthCookieHelper implements CookieHelper {
  setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }
}
