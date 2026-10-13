import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { newCsrfToken } from './web-session-policy';

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
    const secure = process.env.NODE_ENV === 'production';
    const common = { secure, sameSite: 'strict' as const, path: '/' };
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      ...common,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      ...common,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.cookie('csrf_token', newCsrfToken(), {
      httpOnly: false,
      ...common,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  clearAuthCookies(res: Response): void {
    const options = { secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/' };
    res.clearCookie('access_token', options);
    res.clearCookie('refresh_token', options);
    res.clearCookie('csrf_token', options);
  }
}
