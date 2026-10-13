import { ForbiddenException } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export function configuredList(value: string | undefined): string[] {
  return (value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}

export function allowedWebOrigins(): string[] {
  return configuredList(process.env.WEB_ALLOWED_ORIGINS);
}

export function isMobileRequest(req: Request): boolean {
  return req.headers['x-client-type'] === 'mobile' && !req.headers.origin &&
    !req.headers['sec-fetch-site'];
}

export function newCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

function equalTokens(left: unknown, right: unknown): boolean {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function webSessionProtection(req: Request, _res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  if (origin && !allowedWebOrigins().includes(origin)) {
    next(new ForbiddenException('Origin not allowed'));
    return;
  }
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }
  const browser = Boolean(origin || req.headers['sec-fetch-site']);
  if (browser && !origin) {
    next(new ForbiddenException('Origin required'));
    return;
  }
  const hasAuthCookie = Boolean(req.cookies?.access_token || req.cookies?.refresh_token);
  const publicAuthStart = /^\/auth\/(login|register|social-login|social\/exchange-code)$/.test(req.path);
  if (hasAuthCookie && !publicAuthStart &&
      (!origin || !equalTokens(req.cookies?.csrf_token, req.headers['x-csrf-token']))) {
    next(new ForbiddenException('CSRF token invalid'));
    return;
  }
  next();
}
