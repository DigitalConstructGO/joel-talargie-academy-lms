import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import {
  createSignedOAuthState,
  verifySignedOAuthState,
} from '../utils/token.util';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService) {
    super();
  }

  private getSecret(): string {
    return (
      this.config.get<string>('JWT_ACCESS_SECRET') ||
      this.config.get<string>('GOOGLE_CLIENT_SECRET') ||
      'oauth-state-secret-fallback'
    );
  }

  canActivate(context: ExecutionContext) {
    if (
      !this.config.get('GOOGLE_CLIENT_ID') ||
      !this.config.get('GOOGLE_CLIENT_SECRET')
    ) {
      throw new ServiceUnavailableException(
        'Google authentication is not configured',
      );
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { oauthState?: string }>();
    const response = context.switchToHttp().getResponse<Response>();
    const secret = this.getSecret();

    if (
      request.path.endsWith('/callback') ||
      request.path.includes('/callback')
    ) {
      const stateParam =
        typeof request.query.state === 'string' ? request.query.state : '';
      const cookieState = request.cookies?.google_oauth_state;

      const isCookieMatch =
        Boolean(cookieState) &&
        Boolean(stateParam) &&
        stateParam === cookieState;
      const isSignedValid =
        Boolean(stateParam) && verifySignedOAuthState(stateParam, secret);

      if (!isCookieMatch && !isSignedValid) {
        throw new UnauthorizedException('Invalid Google OAuth state');
      }

      response.clearCookie('google_oauth_state', {
        path: '/',
      });
      response.clearCookie('google_oauth_state', {
        path: '/api/v1/auth/google',
      });
    } else {
      request.oauthState = createSignedOAuthState(secret);
      const isProduction = this.config.get('NODE_ENV') === 'production';
      const secure =
        isProduction ||
        Boolean(this.config.get<boolean>('AUTH_COOKIE_SECURE', false)) ||
        Boolean(request.secure) ||
        request.headers?.['x-forwarded-proto'] === 'https';

      response.cookie('google_oauth_state', request.oauthState, {
        httpOnly: true,
        secure,
        sameSite: secure ? 'none' : 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      });
    }

    return super.canActivate(context);
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { oauthState?: string }>();
    return { scope: ['openid', 'email', 'profile'], state: request.oauthState };
  }
}
